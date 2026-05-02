import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';

/* ============================================================
   Toast System
   ============================================================ */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type} ${t.leaving ? 'leaving' : ''}`}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ============================================================
   API Helpers
   ============================================================ */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

/* ============================================================
   useProducts Hook
   ============================================================ */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check health first
      const health = await apiFetch('/api/health');
      if (!health.configured) {
        setConfigured(false);
        setNeedsAuth(health.needsAuth || false);
        setLoading(false);
        return;
      }
      setConfigured(true);
      setNeedsAuth(false);

      // Fetch all products across pages
      let allProducts = [];
      let currentOffset = 0;
      let hasMore = true;

      while (hasMore) {
        const data = await apiFetch(`/api/products?offset=${currentOffset}&page_size=50`);
        if (data.error) {
          throw new Error(data.message || data.error);
        }
        allProducts = allProducts.concat(data.products || []);
        hasMore = data.hasMore;
        currentOffset = data.nextOffset || 0;
      }

      setProducts(
        allProducts.map((p) => ({
          ...p,
          newPrice: null,
          newStock: null,
          selected: false,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleSelect = useCallback((itemId, modelId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.item_id === itemId && p.model_id === modelId ? { ...p, selected: !p.selected } : p
      )
    );
  }, []);

  const selectAll = useCallback((selected) => {
    setProducts((prev) => prev.map((p) => ({ ...p, selected })));
  }, []);

  const updateField = useCallback((itemId, modelId, field, value) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.item_id === itemId && p.model_id === modelId ? { ...p, [field]: value } : p
      )
    );
  }, []);

  const clearModifications = useCallback(() => {
    setProducts((prev) =>
      prev.map((p) => ({ ...p, newPrice: null, newStock: null, selected: false }))
    );
  }, []);

  return {
    products,
    loading,
    error,
    configured,
    needsAuth,
    fetchProducts,
    toggleSelect,
    selectAll,
    updateField,
    clearModifications,
  };
}

/* ============================================================
   Bulk Update
   ============================================================ */
export async function bulkUpdate(updates) {
  return apiFetch('/api/products/bulk-update', {
    method: 'POST',
    body: JSON.stringify({ updates }),
  });
}
