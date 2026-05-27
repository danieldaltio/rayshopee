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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let InvoicesService = class InvoicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(take = 50, skip = 0, search) {
        const where = {};
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
    async findById(id) {
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
    async emitInvoice(orderId) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { invoice: true, customer: true, items: true },
            });
            if (!order) {
                throw new common_1.NotFoundException('Pedido não encontrado');
            }
            if (order.invoice) {
                throw new common_1.BadRequestException('Nota fiscal já emitida para este pedido');
            }
            const numero = Math.floor(Math.random() * 100000).toString();
            const serie = '1';
            const chaveFake = '35' + new Date().getFullYear().toString().slice(2) + new Date().getMonth().toString().padStart(2, '0') + (0, crypto_1.randomBytes)(14).toString('hex').slice(0, 38).padEnd(38, '0');
            const protocolo = (0, crypto_1.randomBytes)(8).toString('hex');
            const invoice = await tx.invoice.create({
                data: {
                    order_id: order.id,
                    numero,
                    serie,
                    chave_acesso: chaveFake,
                    protocolo,
                    status: 'AUTHORIZED',
                    tipo: 'NFE',
                    emitida_em: new Date(),
                    sefaz_mensagem: 'Autorizado o uso da NF-e',
                    xml_url: `https://fake-s3.bucket.com/xml/${chaveFake}.xml`,
                    danfe_pdf_url: `https://fake-s3.bucket.com/danfe/${chaveFake}.pdf`,
                },
            });
            await tx.order.update({
                where: { id: order.id },
                data: { status: 'Para Enviar' },
            });
            return invoice;
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map