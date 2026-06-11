import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Garante que os estoques "Principal" e "Defeito" existem.
   */
  async ensureDefaultLocations(companyId: string) {
    let main = await this.prisma.stockLocation.findFirst({
      where: { company_id: companyId, is_default: true }
    });

    if (!main) {
      main = await this.prisma.stockLocation.create({
        data: {
          name: 'Estoque Principal',
          is_default: true,
          company_id: companyId,
        }
      });
    }

    let defect = await this.prisma.stockLocation.findFirst({
      where: { company_id: companyId, is_defect: true }
    });

    if (!defect) {
      defect = await this.prisma.stockLocation.create({
        data: {
          name: 'Estoque Defeito (Avarias)',
          is_defect: true,
          company_id: companyId,
        }
      });
    }

    return { main, defect };
  }

  /**
   * Registra uma movimentação no Kardex.
   */
  async registerMovement(data: {
    type: MovementType;
    quantity: number;
    productId: string;
    sourceLocId?: string;
    destLocId?: string;
    reason?: string;
    userId?: string;
    orderId?: string;
    companyId: string;
  }) {
    // 1. Cria o log do Kardex
    const movement = await this.prisma.stockMovement.create({
      data: {
        type: data.type,
        quantity: Math.abs(data.quantity),
        reason: data.reason,
        product_id: data.productId,
        source_loc_id: data.sourceLocId,
        dest_loc_id: data.destLocId,
        user_id: data.userId,
        order_id: data.orderId,
        company_id: data.companyId,
      }
    });

    // 2. Atualiza o saldo do produto (Simplificado, refletindo direto na Shopee_stock)
    // Se a movimentação for IN ou OUT do Estoque Principal, atualizamos o saldo físico
    // Obs: Se for TRANSFER para defeito, sai do principal. Se for IN no defeito, não soma pro saldo de venda.
    
    let delta = 0;
    const { main } = await this.ensureDefaultLocations(data.companyId);

    if (data.type === 'IN' && data.destLocId === main.id) {
      delta = Math.abs(data.quantity);
    } else if (data.type === 'OUT' && data.sourceLocId === main.id) {
      delta = -Math.abs(data.quantity);
    } else if (data.type === 'ADJUSTMENT' && data.sourceLocId === main.id) {
      // Adjustment com sinal
      delta = data.quantity; // aceita negativo no adjustment
    } else if (data.type === 'TRANSFER' && data.sourceLocId === main.id && data.destLocId !== main.id) {
      // Transferindo do principal para outro lugar (ex: defeito) -> Diminui saldo de venda
      delta = -Math.abs(data.quantity);
    } else if (data.type === 'TRANSFER' && data.sourceLocId !== main.id && data.destLocId === main.id) {
      // Voltando pro principal
      delta = Math.abs(data.quantity);
    }

    if (delta !== 0) {
      await this.prisma.products.update({
        where: { id: data.productId },
        data: { shopee_stock: { increment: delta } }
      });
      this.logger.log(`Estoque atualizado: Produto ${data.productId} | Delta: ${delta}`);
      
      // Idealmente aqui chamamos a ShopeeSyncProducer para jogar o estoque novo pra Shopee
    }

    return movement;
  }

  /**
   * Resumo de Estoque para o Dashboard
   */
  async getInventorySummary(companyId: string) {
    const { main, defect } = await this.ensureDefaultLocations(companyId);

    // Contagem de Kardex
    // Isso é simplificado para o MVP. O correto seria manter saldo por local na ProductLocation
    const products = await this.prisma.products.findMany({
      where: { company_id: companyId },
      select: { shopee_stock: true }
    });

    const totalAvailable = products.reduce((acc, p) => acc + p.shopee_stock, 0);

    return {
      locations: [main, defect],
      totalAvailable,
    };
  }
}
