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
exports.ShopeeController = void 0;
const common_1 = require("@nestjs/common");
const shopee_service_1 = require("./shopee.service");
let ShopeeController = class ShopeeController {
    shopeeService;
    constructor(shopeeService) {
        this.shopeeService = shopeeService;
    }
    getAuthUrl() {
        const url = this.shopeeService.getAuthUrl();
        return { url };
    }
    async handleCallback(code, shopId, res) {
        try {
            const shopIdNum = parseInt(shopId, 10);
            const tokenData = await this.shopeeService.getAccessToken(code, shopIdNum);
            await this.shopeeService.saveTokens(shopIdNum, tokenData.access_token, tokenData.refresh_token, tokenData.expire_in);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/configuracoes?shopee=connected`);
            this.shopeeService.syncProducts()
                .then(() => this.shopeeService.syncOrders())
                .then(count => console.log(`Auto-sync completed. Synced ${count} orders.`))
                .catch(err => console.error('Auto-sync failed:', err));
        }
        catch (error) {
            console.error('Shopee callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/configuracoes?shopee=error`);
        }
    }
    getStatus() {
        return this.shopeeService.getIntegrationStatus();
    }
    async syncOrders() {
        const count = await this.shopeeService.syncOrders();
        return { success: true, count };
    }
};
exports.ShopeeController = ShopeeController;
__decorate([
    (0, common_1.Get)('auth-url'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ShopeeController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('shop_id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ShopeeController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ShopeeController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('sync-orders'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShopeeController.prototype, "syncOrders", null);
exports.ShopeeController = ShopeeController = __decorate([
    (0, common_1.Controller)('shopee'),
    __metadata("design:paramtypes", [shopee_service_1.ShopeeService])
], ShopeeController);
//# sourceMappingURL=shopee.controller.js.map