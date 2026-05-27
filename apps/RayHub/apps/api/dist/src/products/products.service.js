"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const Papa = __importStar(require("papaparse"));
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(take = 50, skip = 0) {
        const [rawItems, total] = await Promise.all([
            this.prisma.products.findMany({
                where: { is_active: true },
                take,
                skip,
                orderBy: { last_sync: 'desc' },
            }),
            this.prisma.products.count({ where: { is_active: true } }),
        ]);
        const items = rawItems.map(item => ({
            ...item,
            item_id: item.item_id.toString(),
            model_id: item.model_id.toString(),
        }));
        return {
            data: items,
            meta: { total, limit: take, skip },
        };
    }
    async findById(id) {
        const item = await this.prisma.products.findUniqueOrThrow({
            where: { id },
        });
        return {
            ...item,
            item_id: item.item_id.toString(),
            model_id: item.model_id.toString(),
        };
    }
    async create(dto) {
        const item = await this.prisma.products.create({
            data: {
                item_id: BigInt(0),
                model_id: BigInt(0),
                name: dto.name,
                variation_name: dto.variation_name,
                sku: dto.sku,
                GTIN_EAN_BarCode: dto.GTIN_EAN_BarCode,
                shopee_price: dto.shopee_price,
                shopee_stock: dto.shopee_stock,
                cost: dto.cost ?? 0,
                ncm: dto.ncm,
                cfop: dto.cfop,
                cst_csosn: dto.cst_csosn,
                unidade: dto.unidade ?? 'UN',
                peso: dto.peso,
                altura: dto.altura,
                largura: dto.largura,
                comprimento: dto.comprimento,
                estoque_minimo: dto.estoque_minimo ?? 0,
                imagem_url: dto.imagem_url,
                is_active: true,
            },
        });
        return {
            ...item,
            item_id: item.item_id.toString(),
            model_id: item.model_id.toString(),
        };
    }
    async update(id, dto) {
        const item = await this.prisma.products.update({
            where: { id },
            data: { ...dto },
        });
        return {
            ...item,
            item_id: item.item_id.toString(),
            model_id: item.model_id.toString(),
        };
    }
    async deactivate(id) {
        return this.prisma.products.update({
            where: { id },
            data: { is_active: false },
        });
    }
    async importProducts(buffer, source) {
        const csvString = buffer.toString('utf8');
        const parsed = Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
        });
        if (parsed.errors.length > 0) {
            console.warn('PapaParse warnings:', parsed.errors);
        }
        const rows = parsed.data;
        let updatedCount = 0;
        let notFoundCount = 0;
        for (const row of rows) {
            let sku = '';
            let ncm = '';
            let cost = 0;
            let weight = 0;
            if (source === 'bling') {
                sku = row['Código'] || row['codigo'] || '';
                ncm = row['NCM'] || row['ncm'] || '';
                cost = parseFloat(row['Preço Custo'] || row['preco_custo'] || '0');
                weight = parseFloat(row['Peso líquido'] || row['peso_liquido'] || '0');
            }
            else if (source === 'upseller') {
                sku = row['SKU do Produto'] || row['SKU'] || '';
                ncm = row['NCM'] || '';
                cost = parseFloat(row['Custo'] || row['Preço de Custo'] || '0');
                weight = parseFloat(row['Peso (kg)'] || row['Peso'] || '0');
            }
            if (!sku)
                continue;
            const localProduct = await this.prisma.products.findFirst({
                where: { sku: sku }
            });
            if (localProduct) {
                await this.prisma.products.update({
                    where: { id: localProduct.id },
                    data: {
                        ncm: ncm || localProduct.ncm,
                        cost: cost > 0 ? cost : localProduct.cost,
                        peso: weight > 0 ? weight : localProduct.peso,
                    }
                });
                updatedCount++;
            }
            else {
                notFoundCount++;
            }
        }
        return {
            total: rows.length,
            updated: updatedCount,
            notFound: notFoundCount,
        };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map