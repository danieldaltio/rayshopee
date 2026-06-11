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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
const tenant_interceptor_1 = require("../common/tenant/tenant.interceptor");
const tenant_context_1 = require("../common/tenant/tenant.context");
let FinanceController = class FinanceController {
    financeService;
    constructor(financeService) {
        this.financeService = financeService;
    }
    async getAccounts() {
        const companyId = (0, tenant_context_1.getCurrentTenantId)();
        if (!companyId)
            throw new common_1.UnauthorizedException('Tenant ID missing');
        return this.financeService.ensureBasicAccounts(companyId);
    }
    async getSummary(yearStr, monthStr) {
        const now = new Date();
        const year = yearStr ? parseInt(yearStr) : now.getFullYear();
        const month = monthStr ? parseInt(monthStr) : now.getMonth() + 1;
        const companyId = (0, tenant_context_1.getCurrentTenantId)();
        if (!companyId)
            throw new common_1.UnauthorizedException('Tenant ID missing');
        return this.financeService.getMonthlySummary(companyId, year, month);
    }
    async withdraw(body) {
        const companyId = (0, tenant_context_1.getCurrentTenantId)();
        if (!companyId)
            throw new common_1.UnauthorizedException('Tenant ID missing');
        const date = body.date ? new Date(body.date) : new Date();
        const tx = await this.financeService.withdrawFromWallet(companyId, body.amount, date);
        return { success: true, transaction: tx };
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "withdraw", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.UseInterceptors)(tenant_interceptor_1.TenantInterceptor),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map