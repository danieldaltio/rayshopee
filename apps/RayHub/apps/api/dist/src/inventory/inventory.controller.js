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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const tenant_interceptor_1 = require("../common/tenant/tenant.interceptor");
const tenant_context_1 = require("../common/tenant/tenant.context");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async getLocations() {
        const companyId = (0, tenant_context_1.getCurrentTenantId)();
        if (!companyId)
            throw new common_1.UnauthorizedException('Tenant ID missing');
        return this.inventoryService.ensureDefaultLocations(companyId);
    }
    async getSummary() {
        const companyId = (0, tenant_context_1.getCurrentTenantId)();
        if (!companyId)
            throw new common_1.UnauthorizedException('Tenant ID missing');
        return this.inventoryService.getInventorySummary(companyId);
    }
    async createMovement(body) {
        const companyId = (0, tenant_context_1.getCurrentTenantId)();
        if (!companyId)
            throw new common_1.UnauthorizedException('Tenant ID missing');
        const tx = await this.inventoryService.registerMovement({
            ...body,
            companyId,
        });
        return { success: true, movement: tx };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('locations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLocations", null);
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('movement'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createMovement", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map