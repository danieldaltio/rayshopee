import { useState, useMemo } from 'react';
import { calculateProfit, formatBRL } from '../utils/profitCalc';
import EditableCell from './EditableCell';

export default function ProductTable({
  products,
  loading,
  feeConfig,
  onToggleSelect,
  onSelectAll,
  onUpdateField,
}) {
  const allSelected = products.length > 0 && products.every((p) => p.selected);

  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando produtos da Shopee...</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="icon">📦</div>
          <div className="title">Nenhum produto encontrado</div>
          <span>Verifique seus filtros ou recarregue os dados</span>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="center" style={{ width: 40 }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th>Produto</th>
              <th>SKU</th>
              <th className="right">Preço Atual</th>
              <th className="right" style={{ color: 'var(--shopee-orange)' }}>Novo Preço</th>
              <th className="center">Estoque</th>
              <th className="center" style={{ color: 'var(--shopee-orange)' }}>Novo Est.</th>
              <th className="right">Custo</th>
              <th className="right">Taxa</th>
              <th className="right">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={`${product.item_id}-${product.model_id}`}
                product={product}
                feeConfig={feeConfig}
                onToggleSelect={onToggleSelect}
                onUpdateField={onUpdateField}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>{products.length} produto(s) exibido(s)</span>
        <span>Clique em Preço ou Estoque para editar inline</span>
      </div>
    </div>
  );
}

function ProductRow({ product, feeConfig, onToggleSelect, onUpdateField }) {
  const { item_id, model_id, name, variation, sku, image, price, stock, newPrice, newStock, selected } = product;

  const isModified = newPrice !== null || newStock !== null;

  // Calculate profit with current or new price
  const displayPrice = newPrice !== null ? parseFloat(newPrice) : price;
  const currentCost = product.cost || 0;
  
  const profit = useMemo(
    () => calculateProfit(displayPrice, currentCost, feeConfig),
    [displayPrice, currentCost, feeConfig]
  );

  return (
    <tr className={`${selected ? 'selected' : ''} ${isModified ? 'modified' : ''}`}>
      {/* Checkbox */}
      <td className="center">
        <input
          type="checkbox"
          className="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item_id, model_id)}
        />
      </td>

      {/* Product Info */}
      <td>
        <div className="product-cell">
          {image ? (
            <img className="product-img" src={image} alt="" loading="lazy" />
          ) : (
            <div className="product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
          )}
          <div className="product-info">
            <div className="product-name" title={name}>{name}</div>
            {variation && variation !== '—' && (
              <div className="product-variation">{variation}</div>
            )}
          </div>
        </div>
      </td>

      {/* SKU */}
      <td>
        <span className="product-sku">{sku || '—'}</span>
      </td>

      {/* Current Price */}
      <td className="right">
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          {formatBRL(price)}
        </span>
      </td>

      {/* New Price (editable) */}
      <td className="right">
        <EditableCell
          value={newPrice}
          placeholder={price.toFixed(2)}
          onSave={(val) => {
            const parsed = parseFloat(val);
            if (!isNaN(parsed) && parsed > 0) {
              onUpdateField(item_id, model_id, 'newPrice', parsed);
            } else if (val === '' || val === null) {
              onUpdateField(item_id, model_id, 'newPrice', null);
            }
          }}
          prefix="R$"
        />
      </td>

      {/* Current Stock */}
      <td className="center">
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{stock}</span>
      </td>

      {/* New Stock (editable) */}
      <td className="center">
        <EditableCell
          value={newStock}
          placeholder={String(stock)}
          onSave={(val) => {
            const parsed = parseInt(val);
            if (!isNaN(parsed) && parsed >= 0) {
               onUpdateField(item_id, model_id, 'newStock', parsed);
            } else if (val === '' || val === null) {
               onUpdateField(item_id, model_id, 'newStock', null);
            }
          }}
          isInteger
        />
      </td>

      {/* Cost (editable and saves directly to DB) */}
      <td className="right">
        <EditableCell
          value={product.cost > 0 ? product.cost : null}
          placeholder={product.cost > 0 ? product.cost.toFixed(2) : '0.00'}
          onSave={async (val) => {
            const parsed = parseFloat(val);
            const finalCost = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
            
            // Optimistic update in UI
            onUpdateField(item_id, model_id, 'cost', finalCost);

            // Save to backend
            try {
              const res = await fetch('/api/products/update-cost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id, model_id, cost: finalCost }),
              });
              if (!res.ok) {
                console.error('Failed to save cost');
              }
            } catch (err) {
              console.error(err);
            }
          }}
          prefix="R$"
        />
      </td>

      {/* Fees */}
      <td className="right">
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', fontSize: 12 }}>
          {formatBRL(profit.totalTaxasShopee)}
        </span>
      </td>

      {/* Profit */}
      <td className="right">
        <span
          className={`profit-badge ${
            profit.lucroLiquido > 0 ? 'positive' : profit.lucroLiquido < 0 ? 'negative' : 'neutral'
          }`}
        >
          {profit.lucroLiquido >= 0 ? '▲' : '▼'} {formatBRL(Math.abs(profit.lucroLiquido))}
        </span>
      </td>
    </tr>
  );
}
