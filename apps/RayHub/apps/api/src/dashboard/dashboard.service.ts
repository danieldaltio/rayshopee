import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalProducts = await this.prisma.products.count();
    
    // Active orders = only orders that need seller action
    const activeOrders = await this.prisma.order.count({
      where: { 
        status: { in: ['Pendente', 'Aprovado'] }
      },
    });

    const now = new Date();
    
    // Monthly calculations — from start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        data_pedido: { gte: startOfMonth },
        status: { not: { in: ['Cancelado', 'Devolvido'] } }
      }
    });
    const monthlyRevenue = monthlyOrders._sum.total ? Number(monthlyOrders._sum.total) : 0;
    
    const invoicesIssuedMonth = await this.prisma.invoice.count({
      where: {
        created_at: { gte: startOfMonth }
      }
    });

    // Total orders from last 15 days (matches sync window)
    const startOf15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const recentOrders = await this.prisma.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        data_pedido: { gte: startOf15Days },
        status: { not: { in: ['Cancelado', 'Devolvido'] } }
      }
    });
    const recentRevenue = recentOrders._sum.total ? Number(recentOrders._sum.total) : 0;
    const recentOrderCount = recentOrders._count.id || 0;

    const invoicesIssuedToday = await this.prisma.invoice.count({
      where: {
        created_at: { gte: startOf15Days }
      }
    });

    return {
      totalProducts,
      activeOrders,
      monthlyRevenue,
      recentRevenue,
      recentOrderCount,
      invoicesIssuedMonth,
      invoicesIssuedToday,
    };
  }
}

