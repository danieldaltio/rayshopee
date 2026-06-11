import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextType {
  companyId: string | null;
}

export const tenantContext = new AsyncLocalStorage<TenantContextType>();

/**
 * Helper para rodar funções dentro do contexto de um tenant (Empresa)
 */
export function runWithTenant<R>(companyId: string, fn: () => R): R {
  return tenantContext.run({ companyId }, fn);
}

/**
 * Recupera o ID da empresa atual no contexto da requisição.
 * Útil para logs, ou custom queries.
 */
export function getCurrentTenantId(): string | null {
  const store = tenantContext.getStore();
  return store?.companyId || null;
}
