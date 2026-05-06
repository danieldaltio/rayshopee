import { useState, useCallback } from 'react';
import { apiFetch, bulkUpdate } from '../lib/api';

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

export function useProductEditor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ successes: number; failures: number } | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const searchProduct = useCallback(async (sku: string) => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setResult(null);

    try {
      const res = await apiFetch(`/products/search?sku=${encodeURIComponent(sku)}`);
      if (res.items && res.items.length > 0) {
        const item = res.items[0];
        setProduct({
          item_id: item.item_id,
          item_name: item.item_name,
          variations: (item.variations || []).map((v: any) => ({
            model_id: v.model_id,
            name: v.variation_name || v.name,
            price: v.price,
            stock: v.stock,
          })),
        });
      } else {
        setError('Produto não encontrado');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar produto');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVariation = useCallback((modelId: number, field: 'price' | 'stock', value: number) => {
    setProduct((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        variations: prev.variations.map((v) =>
          v.model_id === modelId
            ? {
                ...v,
                [field === 'price' ? 'pendingPrice' : 'pendingStock']: value,
                dirty: v.pendingPrice !== undefined || v.pendingStock !== undefined,
              }
            : v
        ),
      };
    });
  }, []);

  const submitUpdates = useCallback(async () => {
    if (!product) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const updates = product.variations
        .filter((v) => v.dirty)
        .map((v) => ({
          item_id: product.item_id,
          model_id: v.model_id,
          newPrice: v.pendingPrice ?? v.price,
          newStock: v.pendingStock ?? v.stock,
        }));

      if (updates.length === 0) {
        setError('Nenhuma alteração para salvar.');
        setLoading(false);
        return;
      }

      const res = await bulkUpdate(updates);
      setResult(res);

      if (res.failures > 0) {
        setError(`${res.failures} atualização(ões) falharam.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [product]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const resetProduct = useCallback(() => {
    setProduct(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    result,
    product,
    searchProduct,
    updateVariation,
    submitUpdates,
    clearResult,
    resetProduct,
  };
}