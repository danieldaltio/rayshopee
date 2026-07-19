import React from 'react';
import { formatDate, formatCurrency } from '../utils/format.js';

const returnStatusMap = {
  'REQUESTED': 'Em análise pela Shopee',
  'JUDGING': 'Em análise pela Shopee',
  'PROCESSING': 'Em análise pela Shopee',
  'ACCEPTED': 'Reembolso Pago',
  'REFUND_PAID': 'Reembolso Pago',
  'CLOSED': 'Fechada',
  'SELLER_DISPUTE': 'Em disputa',
  'CANCELLED': 'Cancelada'
};

const returnReasonMap = {
  'CHANGE_MIND': 'Arrependimento',
  'WRONG_ITEM': 'Item Errado',
  'FUNCTIONAL_DMG': 'Dano Funcional',
  'ITEM_MISSING': 'Item Faltando',
  'NOT_RECEIPT': 'Não Recebido',
  'PHYSICAL_DMG': 'Dano Físico',
  'DAMAGED_OTHERS': 'Outros Danos'
};

export default function OrderCard({ order, selected, onToggle, onDownloadXml, downloadingXml }) {
  const isDeliveryFailed = order.orderType === 'DELIVERY_FAILED';
  const isCancelled = order.orderType === 'CANCELLED';
  const isReturned = order.orderType === 'RETURNED';

  return (
    <div className={`order-card ${selected ? 'selected' : ''}`}>
      <div className="order-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(order.orderSn)}
        />
      </div>

      <div className="order-content">
        <div className="order-header">
          <div className="order-ids" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="order-sn" style={{ fontSize: '15px', fontWeight: 'bold' }}>ID do Pedido: {order.orderSn}</span>
            {order.returnInfo?.return_sn && (
              <span className="return-sn" style={{ fontSize: '13px', color: '#e63946', fontWeight: 'bold' }}>
                ID da Solicitação: {order.returnInfo.return_sn}
              </span>
            )}
          </div>
          <div className="order-badges">
            {isDeliveryFailed && <span className="badge badge-cancelled">Falha de Entrega</span>}
            {isCancelled && <span className="badge badge-cancelled">Cancelado</span>}
            {isReturned && <span className="badge badge-returned">Devolvido</span>}
            {order.hasXml ? (
              <span className="badge badge-xml">XML</span>
            ) : (
              <span className="badge badge-noxml">Sem XML</span>
            )}
            {order.returnInfo && (
              <>
                <span className={`badge badge-return-status ${order.returnInfo.status === 'CANCELLED' ? 'badge-cancelled' : 'badge-returned'}`} title={`Status da Solicitação: ${order.returnInfo.status}`}>
                  {returnStatusMap[order.returnInfo.status] || order.returnInfo.status}
                </span>
                <span className="badge badge-return-reason" title={order.returnInfo.text_reason || 'Motivo da Devolução'}>
                  {returnReasonMap[order.returnInfo.reason] || order.returnInfo.reason}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="order-info">
          <span>Data: {formatDate(order.createTime)}</span>
          <span>Valor: {formatCurrency(order.totalAmount)}</span>
          {order.invoiceData?.invoiceNumber && (
            <span>NF: {order.invoiceData.invoiceNumber}</span>
          )}
          {order.invoiceData?.accessKey && (
            <span title={order.invoiceData.accessKey}>Chave: {order.invoiceData.accessKey}</span>
          )}
        </div>

        {order.items && order.items.length > 0 && (
          <div className="order-items">
            {order.items.map((item, i) => (
              <span key={i}>
                {item.name}
                {item.quantity > 1 ? ` x${item.quantity}` : ''}
                {i < order.items.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="order-actions">
        {order.hasXml && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onDownloadXml(order.orderSn)}
            disabled={downloadingXml}
          >
            {downloadingXml ? (
              <>
                <div className="spinner" style={{ width: 12, height: 12 }} />
                Baixando...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Baixar XML
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
