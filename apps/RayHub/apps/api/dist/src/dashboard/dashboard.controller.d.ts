import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
