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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    logger = new common_1.Logger(InventoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async ensureDefaultLocations(companyId) {
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
    async registerMovement(data) {
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
        let delta = 0;
        const { main } = await this.ensureDefaultLocations(data.companyId);
        if (data.type === 'IN' && data.destLocId === main.id) {
            delta = Math.abs(data.quantity);
        }
        else if (data.type === 'OUT' && data.sourceLocId === main.id) {
            delta = -Math.abs(data.quantity);
        }
        else if (data.type === 'ADJUSTMENT' && data.sourceLocId === main.id) {
            delta = data.quantity;
        }
        else if (data.type === 'TRANSFER' && data.sourceLocId === main.id && data.destLocId !== main.id) {
            delta = -Math.abs(data.quantity);
        }
        else if (data.type === 'TRANSFER' && data.sourceLocId !== main.id && data.destLocId === main.id) {
            delta = Math.abs(data.quantity);
        }
        if (delta !== 0) {
            await this.prisma.products.update({
                where: { id: data.productId },
                data: { shopee_stock: { increment: delta } }
            });
            this.logger.log(`Estoque atualizado: Produto ${data.productId} | Delta: ${delta}`);
        }
        return movement;
    }
    async getInventorySummary(companyId) {
        const { main, defect } = await this.ensureDefaultLocations(companyId);
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map