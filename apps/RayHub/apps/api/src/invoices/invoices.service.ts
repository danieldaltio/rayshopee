import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(take = 50, skip = 0, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { numero: { contains: search } },
        { chave_acesso: { contains: search } },
        { order: { shopee_order_sn: { contains: search } } },
        { order: { customer: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, limit: take, skip },
    };
  }

  async findById(id: string) {
    return this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }

  async emitInvoice(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verifica se o pedido existe
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { invoice: true, customer: true, items: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      // 2. Verifica se a NF já foi emitida
      if (order.invoice) {
        throw new BadRequestException('Nota fiscal já emitida para este pedido');
      }

      // 3. Simula tempo de comunicação com API (SEFAZ/Plugin) - Mock Local
      // Gera dados fake
      const numero = Math.floor(Math.random() * 100000).toString();
      const serie = '1';
      // Gera uma chave de acesso fake (44 dígitos)
      const chaveFake = '35' + new Date().getFullYear().toString().slice(2) + new Date().getMonth().toString().padStart(2, '0') + randomBytes(14).toString('hex').slice(0, 38).padEnd(38, '0');
      const protocolo = randomBytes(8).toString('hex');

      // 4. Cria a nota no banco
      const invoice = await tx.invoice.create({
        data: {
          order_id: order.id,
          numero,
          serie,
          chave_acesso: chaveFake,
          protocolo,
          status: 'AUTHORIZED', // Enums do Prisma
          tipo: 'NFE',
          emitida_em: new Date(),
          sefaz_mensagem: 'Autorizado o uso da NF-e',
          xml_url: `https://fake-s3.bucket.com/xml/${chaveFake}.xml`,
          danfe_pdf_url: `https://fake-s3.bucket.com/danfe/${chaveFake}.pdf`,
        },
      });

      // 5. Atualiza o status do pedido para "Para Enviar"
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'Para Enviar' },
      });

      return invoice;
    });
  }
}
