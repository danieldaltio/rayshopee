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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(take = 50, skip = 0, status, search) {
        const where = {};
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
    async findById(id) {
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
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        return order;
    }
    async injectMock(dto) {
        return this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: dto.customer,
            });
            for (const item of dto.items) {
                const productExists = await tx.products.findUnique({
                    where: { id: item.product_id },
                });
                if (!productExists) {
                    throw new common_1.NotFoundException(`Produto com ID ${item.product_id} não encontrado`);
                }
            }
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map