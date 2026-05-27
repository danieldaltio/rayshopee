"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const totalProducts = await this.prisma.products.count();
        const activeOrders = await this.prisma.order.count({
            where: {
                status: { in: ['Pendente', 'Aprovado'] }
            },
        });
        const now = new Date();
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
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map