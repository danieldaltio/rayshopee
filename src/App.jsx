import { useState, useMemo, useEffect, useCallback } from 'react';
import { ToastProvider, useToast, useProducts, bulkUpdate } from './hooks/useProducts.jsx';
import { calculateProfit, formatBRL } from './utils/profitCalc';
import ProductTable from './components/ProductTable';
import ScannerModal from './components/ScannerModal';

function AppContent() {
  const {
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
  } = useProducts();

  const toast = useToast();
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [feeConfig, setFeeConfig] = useState({
    taxaTransacao: 0.02,
    impostoGoverno: 0.06,
  });
  const [showScanner, setShowScanner] = useState(false);

  // ── Listen for OAuth callback message ──
  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === 'shopee-auth-success') {
        toast('🎉 Autorização concluída com sucesso!', 'success', 5000);
        setAuthorizing(false);
        // Wait a moment then reload products
        setTimeout(() => fetchProducts(), 1000);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, fetchProducts]);

  // ── Start OAuth Flow ──
  const handleAuthorize = useCallback(async () => {
    setAuthorizing(true);
    try {
      const res = await fetch('/api/auth/url');
      const data = await res.json();
      if (data.url) {
        // Open Shopee authorization page in popup
        const popup = window.open(
          data.url,
          'shopee-auth',
          'width=800,height=700,left=200,top=100,scrollbars=yes'
        );
        if (!popup) {
          toast('Pop-up bloqueado! Permita pop-ups para este site.', 'error');
          setAuthorizing(false);
        }
        // Fallback: check if popup was closed without completing
        const checker = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checker);
            setAuthorizing(false);
          }
        }, 1000);
      } else {
        toast('Erro ao gerar URL de autorização', 'error');
        setAuthorizing(false);
      }
    } catch (err) {
      toast(`Erro: ${err.message}`, 'error');
      setAuthorizing(false);
    }
  }, [toast]);

  // ── Filtered Products ──
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.variation?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    );
  }, [products, search]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = products.length;
    const selected = products.filter((p) => p.selected).length;
    const modified = products.filter((p) => p.newPrice !== null || p.newStock !== null).length;
    const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    return { total, selected, modified, totalStock };
  }, [products]);

  // ── Send Updates ──
  async function handleSendUpdates() {
    const toSend = products.filter(
      (p) => p.selected && (p.newPrice !== null || p.newStock !== null)
    );
    if (toSend.length === 0) {
      toast('Selecione itens com alterações para enviar', 'error');
      return;
    }

    setSending(true);
    try {
      const updates = toSend.map((p) => ({
        item_id: p.item_id,
        model_id: p.model_id,
        newPrice: p.newPrice,
        newStock: p.newStock,
      }));

      const result = await bulkUpdate(updates);

      if (result.success) {
        toast(`✅ ${toSend.length} item(ns) atualizado(s) com sucesso!`, 'success');
        clearModifications();
        setTimeout(fetchProducts, 1500);
      } else {
        toast(`⚠️ ${result.failures} falha(s) de ${result.total} atualizações`, 'error');
      }
    } catch (err) {
      toast(`Erro: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  }

  // ── Needs Authorization ──
  if (!loading && (needsAuth || (!configured && !error))) {
    return (
      <div className="app">
        <div className="config-warning">
          <div className="icon">🔐</div>
          <h2>Autorizar Shopee</h2>
          <p>
            Clique no botão abaixo para abrir a página de login da Shopee.
            Após autorizar, o dashboard carregará seus produtos automaticamente.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleAuthorize}
            disabled={authorizing}
            style={{ marginTop: 12, padding: '14px 32px', fontSize: 15 }}
          >
            {authorizing ? '⏳ Aguardando autorização...' : '🔑 Autorizar com Shopee'}
          </button>
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            O token será salvo automaticamente e renovado a cada 4 horas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">🛍️</div>
          <div>
            <div className="header-title">RayShopee</div>
            <div className="header-subtitle">Gerenciador de Preços & Estoque</div>
          </div>
        </div>
        <div className="header-right">
          {error && error.includes('access_token') ? (
            <button
              className="btn btn-sm"
              onClick={handleAuthorize}
              disabled={authorizing}
              style={{ background: 'rgba(238,77,45,0.15)', borderColor: 'var(--shopee-orange)', color: 'var(--shopee-orange)' }}
            >
              {authorizing ? '⏳ Autorizando...' : '🔑 Re-autorizar'}
            </button>
          ) : (
            <div className={`status-badge ${error ? 'error' : ''}`}>
              <span className="status-dot" />
              {error ? 'Erro' : 'Conectado'}
            </div>
          )}
          <button className="btn btn-sm" onClick={fetchProducts} title="Recarregar">
            🔄 Atualizar
          </button>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">Total Produtos</div>
          <div className="stat-value orange">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Estoque Total</div>
          <div className="stat-value blue">{stats.totalStock.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Selecionados</div>
          <div className="stat-value purple">{stats.selected}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Modificados</div>
          <div className="stat-value green">{stats.modified}</div>
        </div>
      </div>

      {/* ── Fee Config ── */}
      <div className="fee-panel">
        <div className="fee-panel-header" onClick={() => setShowFees(!showFees)}>
          <h3>⚙️ Configuração de Taxas (Cálculo de Lucro)</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{showFees ? '▲' : '▼'}</span>
        </div>
        {showFees && (
          <div className="fee-panel-body">
            <div className="fee-input-group">
              <label>Taxa Transação (%)</label>
              <input
                type="number"
                step="0.01"
                value={(feeConfig.taxaTransacao * 100).toFixed(1)}
                onChange={(e) =>
                  setFeeConfig((c) => ({ ...c, taxaTransacao: parseFloat(e.target.value) / 100 || 0 }))
                }
              />
            </div>
            <div className="fee-input-group">
              <label>Imposto Governo (%)</label>
              <input
                type="number"
                step="0.01"
                value={(feeConfig.impostoGoverno * 100).toFixed(1)}
                onChange={(e) =>
                  setFeeConfig((c) => ({ ...c, impostoGoverno: parseFloat(e.target.value) / 100 || 0 }))
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por nome, variação ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn" style={{ marginLeft: '8px', padding: '6px 12px' }} onClick={() => setShowScanner(true)} title="Ler Código de Barras">
            📷 Ler Código
          </button>
        </div>

        {stats.selected > 0 && (
          <>
            <span className="selected-count">☑ {stats.selected} selecionado(s)</span>
            <button className="btn btn-sm" onClick={() => selectAll(false)}>
              Limpar Seleção
            </button>
          </>
        )}

        {stats.modified > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleSendUpdates}
            disabled={sending || stats.selected === 0}
          >
            {sending ? '⏳ Enviando...' : `🚀 Enviar ${stats.modified} Alteração(ões)`}
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && !error.includes('access_token') && (
        <div style={{ color: 'var(--accent-red)', padding: '12px 0', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Product Table ── */}
      <ProductTable
        products={filtered}
        loading={loading}
        feeConfig={feeConfig}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onUpdateField={updateField}
      />

      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onScan={(barcode) => {
            setSearch(barcode);
            setShowScanner(false);
            toast(`✅ Código lido: ${barcode}`, 'success');
          }}
        />
      )}

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '32px 0 16px', color: 'var(--text-muted)', fontSize: 11 }}>
        RayShopee v1.0 — Feito com ☕ para gerenciar sua loja Shopee
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
