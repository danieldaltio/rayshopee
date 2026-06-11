import { AsyncLocalStorage } from 'async_hooks';
export interface TenantContextType {
    companyId: string | null;
}
export declare const tenantContext: AsyncLocalStorage<TenantContextType>;
export declare function runWithTenant<R>(companyId: string, fn: () => R): R;
export declare function getCurrentTenantId(): string | null;
