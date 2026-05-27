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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const products_service_1 = require("./products.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const shopee_service_1 = require("../shopee/shopee.service");
let ProductsController = class ProductsController {
    productsService;
    shopeeService;
    constructor(productsService, shopeeService) {
        this.productsService = productsService;
        this.shopeeService = shopeeService;
    }
    async syncShopee() {
        try {
            const count = await this.shopeeService.syncProducts();
            return { success: true, count };
        }
        catch (error) {
            if (error.message && error.message.includes('Shopee is not connected')) {
                throw new common_1.HttpException('Sua conta da Shopee não está conectada. Acesse Configurações -> Integrações e conecte antes de sincronizar.', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException(error.message || 'Erro interno na sincronização', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async importProducts(file, source) {
        if (!file) {
            throw new common_1.HttpException('Arquivo não fornecido', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.productsService.importProducts(file.buffer, source);
            return { success: true, ...result };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Erro interno na importação', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    findAll(take, skip) {
        const limit = take ? parseInt(take, 10) : 50;
        const offset = skip ? parseInt(skip, 10) : 0;
        return this.productsService.findAll(limit, offset);
    }
    findOne(id) {
        return this.productsService.findById(id);
    }
    create(dto) {
        return this.productsService.create(dto);
    }
    update(id, dto) {
        return this.productsService.update(id, dto);
    }
    deactivate(id) {
        return this.productsService.deactivate(id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)('sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "syncShopee", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "importProducts", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('take')),
    __param(1, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "deactivate", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        shopee_service_1.ShopeeService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map