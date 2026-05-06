export const config = {
  apiBase: process.env.EXPO_PUBLIC_API_BASE || 'http://10.0.2.2:3001/api',
};

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export interface Variation {
  model_id: number;
  name: string;
  price: number;
  stock: number;
  pendingPrice?: number;
  pendingStock?: number;
  dirty?: boolean;
}

export interface Product {
  item_id: number;
  item_name: string;
  variations: Variation[];
}

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<any> {
  const url = `${config.apiBase}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function searchBySku(sku: string) {
  return apiFetch(`/products/search?sku=${encodeURIComponent(sku)}`);
}

export async function getProduct(itemId: number) {
  return apiFetch(`/products/${itemId}`);
}

export async function bulkUpdate(updates: any[]) {
  return apiFetch('/products/bulk-update', {
    method: 'POST',
    body: JSON.stringify({ updates }),
  });
}

export function formatPrice(price: number): string {
  return `R$ ${(price / 100000).toFixed(2).replace('.', ',')}`;
}

export function parsePrice(text: string): number {
  const num = parseFloat(text.replace(',', '.').replace(/[^\d.]/g, ''));
  return Math.round(num * 100000);
}