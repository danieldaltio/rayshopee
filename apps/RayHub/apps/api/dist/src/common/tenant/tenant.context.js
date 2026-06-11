"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantContext = void 0;
exports.runWithTenant = runWithTenant;
exports.getCurrentTenantId = getCurrentTenantId;
const async_hooks_1 = require("async_hooks");
exports.tenantContext = new async_hooks_1.AsyncLocalStorage();
function runWithTenant(companyId, fn) {
    return exports.tenantContext.run({ companyId }, fn);
}
function getCurrentTenantId() {
    const store = exports.tenantContext.getStore();
    return store?.companyId || null;
}
//# sourceMappingURL=tenant.context.js.map