import React from 'react';

export default function Header({ connected, shopId, pending }) {
  return (
    <header className="header">
      <div className="header-title">
        <h1>Shopee — Baixador de XML</h1>
        <span>Devoluções & Cancelados</span>
      </div>
      <div className="api-status">
        <div className={`api-status-dot ${connected ? 'connected' : pending ? 'pending' : ''}`} />
        <span>
          {!connected ? 'API não autorizada' : pending ? 'Token expirado' : `Shop ID: ${shopId || '—'}`}
        </span>
      </div>
    </header>
  );
}
