import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockInjectOrderDto } from './dto/mock-inject.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(take = 50, skip = 0, status?: string, search?: string) {
    const where: any = {};
    if (status && status !== 'Todos') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { shopee_order_sn: { contains: search } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        take,
        skip,
        orderBy: { data_pedido: 'desc' },
        include: { customer: true },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, limit: take, skip },
    };
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        invoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  async injectMock(dto: MockInjectOrderDto) {
    // Executa em transação para garantir que Customer, Order e OrderItems sejam salvos juntos
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria ou atualiza o cliente (aqui vamos só criar para simplificar o mock)
      const customer = await tx.customer.create({
        data: dto.customer,
      });

      // 2. Verifica os produtos existem
      for (const item of dto.items) {
        const productExists = await tx.products.findUnique({
          where: { id: item.product_id },
        });
        if (!productExists) {
          throw new NotFoundException(`Produto com ID ${item.product_id} não encontrado`);
        }
      }

      // 3. Cria o pedido
      const order = await tx.order.create({
        data: {
          shopee_order_sn: dto.shopee_order_sn,
          status: dto.status,
          canal: 'shopee',
          subtotal: dto.subtotal,
          frete: dto.frete,
          desconto: dto.desconto || 0,
          total: dto.total,
          shopee_comissao: dto.shopee_comissao || 0,
          data_pedido: new Date(),
          customer_id: customer.id,
          items: {
            create: dto.items.map((item) => ({
              product_id: item.product_id,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              subtotal: item.quantidade * item.preco_unitario,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return order;
    });
  }
}
