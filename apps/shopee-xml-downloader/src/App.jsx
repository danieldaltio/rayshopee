import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import OrderList from './components/OrderList.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import { fetchCancelledReturnedOrders, downloadXml, downloadZip, checkHealth, downloadXmlByAccessKey, syncSefaz } from './api.js';

// Remove MAX_DAYS constant since we don't use chunks anymore
const DEFAULT_DAYS = 30;

function getDefaultDates() {
  const now = new Date();
  const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfPrevMonth = new Date(firstDayOfThisMonth);
  lastDayOfPrevMonth.setDate(lastDayOfPrevMonth.getDate() - 1);
  const firstDayOfPrevMonth = new Date(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), 1);
  
  return {
    from: firstDayOfPrevMonth.toISOString().split('T')[0],
    to: lastDayOfPrevMonth.toISOString().split('T')[0],
  };
}

function toUnix(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

export default function App() {
  const [health, setHealth] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingXmls, setDownloadingXmls] = useState(new Set());
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const [dateFrom, setDateFrom] = useState(getDefaultDates().from);
  const [dateTo, setDateTo] = useState(getDefaultDates().to);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalStats, setTotalStats] = useState({ cancelled: 0, returned: 0, withXml: 0 });
  const [loadProgress, setLoadProgress] = useState('');

  useEffect(() => {
    checkHealth().then(setHealth).catch(() => setHealth({}));
  }, []);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const showToast = (msg, type = 'info') => addToast(msg, type);

  async function handleSearch() {
    if (!health.configured) {
      showToast('Shopee API não autorizada. Acesse / para autorizar.', 'error');
      return;
    }
    setLoading(true);
    setOrders([]);
    setSelectedOrders(new Set());
    setLoadProgress('Preparando busca...');
    try {
      const fromMs = new Date(dateFrom).getTime();
      const toMs = new Date(dateTo).getTime();
      
      const interval = 7 * 24 * 60 * 60 * 1000; // 7 days
      let currentFromMs = fromMs;
      let allResultOrders = [];

      while (currentFromMs <= toMs) {
        let currentToMs = currentFromMs + interval;
        if (currentToMs > toMs) currentToMs = toMs;

        const timeFrom = Math.floor(currentFromMs / 1000);
        const timeTo = Math.floor(currentToMs / 1000);
        
        const strFrom = new Date(currentFromMs).toLocaleDateString('pt-BR');
        const strTo = new Date(currentToMs).toLocaleDateString('pt-BR');
        setLoadProgress(`Buscando de ${strFrom} até ${strTo}...`);

        const data = await fetchCancelledReturnedOrders(timeFrom, timeTo, statusFilter);
        allResultOrders.push(...(data.orders || []));

        currentFromMs = currentToMs + 1000;
      }

      let result = allResultOrders;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        result = result.filter(o =>
          o.orderSn.toLowerCase().includes(q) ||
          o.invoiceData?.invoiceNumber?.toLowerCase().includes(q) ||
          o.items?.some(i => i.name.toLowerCase().includes(q))
        );
      }

      // Remove duplicates just in case chunks overlap
      const uniqueOrdersMap = new Map();
      result.forEach(o => uniqueOrdersMap.set(o.orderSn, o));
      result = Array.from(uniqueOrdersMap.values());

      // Sort by createTime descending (newest first)
      result.sort((a, b) => b.createTime - a.createTime);

      setOrders(result);

      const cancelled = result.filter(o => o.status === 'CANCELLED').length;
      const returned = result.filter(o => o.status === 'RETURNED' || o.status === 'COMPLETED').length;
      const withXml = result.filter(o => o.hasXml).length;
      setTotalStats({ cancelled, returned, withXml });

      showToast(`${result.length} pedidos encontrados`, 'success');
      setLoadProgress('');
    } catch (err) {
      showToast(err.message, 'error');
      setLoadProgress('');
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncSefaz() {
    setLoading(true);
    setLoadProgress('Sincronizando com SEFAZ...');
    try {
      const data = await syncSefaz(toUnix(dateFrom), toUnix(dateTo));
      showToast(`Sincronização concluída: ${data.total || 0} XMLs processados`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
      setLoadProgress('');
    }
  }

  function handleToggleOrder(orderSn) {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderSn)) next.delete(orderSn);
      else next.add(orderSn);
      return next;
    });
  }

  function handleSelectCount(count) {
    const selectable = orders.filter(o => o.invoiceData?.accessKey);
    setSelectedOrders(new Set(selectable.slice(0, count).map(o => o.orderSn)));
  }

  function handleSelectNext(count) {
    const selectable = orders.filter(o => o.invoiceData?.accessKey);
    const selectableSns = selectable.map(o => o.orderSn);
    
    // Find the last selected index
    let lastIndex = -1;
    selectableSns.forEach((sn, idx) => {
      if (selectedOrders.has(sn)) lastIndex = idx;
    });

    const startIndex = lastIndex + 1;
    if (startIndex >= selectableSns.length) {
      showToast('Fim da lista alcançado', 'info');
      return;
    }

    const nextBatch = selectableSns.slice(startIndex, startIndex + count);
    setSelectedOrders(new Set(nextBatch));
  }

  function handleSelectAll() {
    const selectable = orders.filter(o => o.invoiceData?.accessKey);
    if (selectedOrders.size === selectable.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(selectable.map(o => o.orderSn)));
    }
  }

  async function handleDownloadXml(orderSn) {
    setDownloadingXmls(prev => new Set([...prev, orderSn]));
    try {
      await downloadXml(orderSn);
      showToast(`XML ${orderSn} baixado!`, 'success');
    } catch (err) {
      showToast(`Erro: ${err.message}`, 'error');
    } finally {
      setDownloadingXmls(prev => {
        const next = new Set(prev);
        next.delete(orderSn);
        return next;
      });
    }
  }

  async function handleBulkDownload() {
    if (selectedOrders.size === 0) {
      showToast('Selecione pelo menos um pedido', 'error');
      return;
    }
    try {
      await downloadZip([...selectedOrders]);
      showToast(`${selectedOrders.size} XMLs baixados em ZIP!`, 'success');
    } catch (err) {
      showToast(`Erro: ${err.message}`, 'error');
    }
  }

  async function handleDownloadByAccessKey(key) {
    setLoading(true);
    try {
      await downloadXmlByAccessKey(key);
      showToast('XML baixado com sucesso!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const selectableOrders = orders.filter(o => o.invoiceData?.accessKey); // Only orders with accessKey can be downloaded
  const allSelected = selectableOrders.length > 0 && selectedOrders.size === selectableOrders.length;

  return (
    <div className="app">
      <Header
        connected={health.configured}
        shopId={health.shopId}
        pending={health.needsAuth}
      />

      <main className="main">
        <div className="search-box">
          <div className="search-row">
            <div className="search-field">
              <label>Data Início</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div className="search-field">
              <label>Data Fim</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            <div className="search-field">
              <label>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="ALL">Todos</option>
                <option value="CANCELLED">Cancelados</option>
                <option value="RETURNED">Devolvidos</option>
              </select>
            </div>
            <div className="search-field">
              <label>Buscar</label>
              <input
                type="text"
                placeholder="Pedido, NF ou chave..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  Buscando...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Buscar Pedidos
                </>
              )}
            </button>
            <button 
              className="btn btn-accent" 
              onClick={handleSyncSefaz} 
              disabled={loading}
              title="Sincroniza todos os XMLs emitidos para seu CNPJ no período diretamente da SEFAZ"
              style={{ marginLeft: 8 }}
            >
              {loading ? 'Sincronizando...' : 'Sincronizar SEFAZ'}
            </button>
            {searchQuery.length === 44 && !isNaN(searchQuery) && (
              <button 
                className="btn btn-accent" 
                onClick={() => handleDownloadByAccessKey(searchQuery)}
                style={{ marginLeft: 8 }}
              >
                Baixar por Chave
              </button>
            )}
          </div>
        </div>

        {orders.length > 0 && (
          <>
            <div className="stats">
              <div className="stat-card">
                <div className="stat-card-label">Total</div>
                <div className="stat-card-value">{orders.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Cancelados</div>
                <div className="stat-card-value danger">{totalStats.cancelled}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Devolvidos</div>
                <div className="stat-card-value warning">{totalStats.returned}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Com XML</div>
                <div className="stat-card-value accent">{totalStats.withXml}</div>
              </div>
            </div>

            {selectableOrders.length > 0 && (
              <div className="bulk-actions">
                <div className="bulk-row">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                    />
                    <span className="bulk-info">
                      <strong>{selectedOrders.size}</strong> / {selectableOrders.length} selecionados
                    </span>
                  </label>
                  <div className="bulk-group-container">
                    <div className="bulk-group">
                      <span className="bulk-label">Selecionar:</span>
                      {[5, 10, 15, 50, 100, 300, 500, 700, 1000, 2000].map(n => (
                        <button key={`sel-${n}`} className="btn btn-ghost btn-xs" onClick={() => handleSelectCount(n)}>{n}</button>
                      ))}
                    </div>
                    <div className="bulk-group">
                      <span className="bulk-label">Próximos:</span>
                      {[5, 10, 15, 50, 100, 300, 500, 700, 1000, 2000].map(n => (
                        <button key={`next-${n}`} className="btn btn-ghost btn-xs" onClick={() => handleSelectNext(n)}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleBulkDownload}
                    disabled={selectedOrders.size === 0}
                    style={{ marginLeft: 'auto' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Baixar ZIP ({selectedOrders.size})
                  </button>
                </div>
              </div>
            )}

            <OrderList
              orders={orders}
              selectedOrders={selectedOrders}
              onToggle={handleToggleOrder}
              onDownloadXml={handleDownloadXml}
              downloadingXmls={downloadingXmls}
            />
          </>
        )}

        {loading && <LoadingSpinner message={loadProgress || 'Buscando pedidos na Shopee...'} />}
      </main>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {t.type === 'error' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
