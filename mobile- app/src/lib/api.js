export const config = {
  apiBase: 'http://10.0.2.2:3001/api',
  shopeeBase: 'https://partner. shopeemobile.com',
};

export async function apiFetch(path, options = {}) {
  const url = `${config.apiBase}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getHealth() {
  return apiFetch('/health');
}

export async function searchBySku(sku) {
  const res = await apiFetch(`/products/search?sku=${encodeURIComponent(sku)}`);
  return res;
}

export async function getProduct(itemId) {
  const res = await apiFetch(`/products/${itemId}`);
  return res;
}

export async function bulkUpdate(updates) {
  return apiFetch('/products/bulk-update', {
    method: 'POST',
    body: JSON.stringify({ updates }),
  });
}

export function formatPrice(price) {
  return `R$ ${(price / 100000).toFixed(2).replace('.', ',')}`;
}

export function parsePrice(text) {
  const num = parseFloat(text.replace(',', '.').replace(/[^\d.]/g, ''));
  return Math.round(num * 100000);
}