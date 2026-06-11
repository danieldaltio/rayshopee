import React from 'react';
import OrderCard from './OrderCard.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function OrderList({ orders, selectedOrders, onToggle, onDownloadXml, downloadingXmls }) {
  if (!orders) return null;

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h3>Nenhum pedido encontrado</h3>
        <p>Tente outro período ou ajuste os filtros.</p>
      </div>
    );
  }

  return (
    <div className="order-list">
      {orders.map(order => (
        <OrderCard
          key={order.orderSn}
          order={order}
          selected={selectedOrders.has(order.orderSn)}
          onToggle={onToggle}
          onDownloadXml={onDownloadXml}
          downloadingXml={downloadingXmls.has(order.orderSn)}
        />
      ))}
    </div>
  );
}
