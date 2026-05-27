import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        totalProducts: number;
        activeOrders: number;
        monthlyRevenue: number;
        recentRevenue: number;
        recentOrderCount: number;
        invoicesIssuedMonth: number;
        invoicesIssuedToday: number;
    }>;
}
