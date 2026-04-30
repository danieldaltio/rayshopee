import { useState, useCallback } from 'react';
import { apiFetch, bulkUpdate } from '../lib/api';

export function useProductEditor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const submitUpdates = useCallback(async (itemId, variations) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const updates = variations
        .filter((v) => v.dirty)
        .map((v) => ({
          item_id: itemId,
          model_id: v.model_id || 0,
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, submitUpdates, clearResult };
}