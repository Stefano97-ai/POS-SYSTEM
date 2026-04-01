import { Minus, Plus, Trash2, Percent } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

export default function CartItem({ item, onUpdateQuantity, onRemove, onUpdateDiscount, currency = 'S/.' }) {
  const [showDiscount, setShowDiscount] = useState(false);
  const price = item.price || item.precioVenta || 0;
  const discount = item.discount || 0;
  const itemTotal = price * item.quantity;
  const discountAmount = itemTotal * (discount / 100);
  const finalTotal = itemTotal - discountAmount;

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <span className="cart-item-name">{item.name || item.nombre}</span>
        <span className="cart-item-price">
          {formatCurrency(price, currency)} c/u
          {discount > 0 && <span style={{ color: 'var(--color-danger)', marginLeft: '4px', fontSize: '0.65rem' }}>-{discount}%</span>}
        </span>
      </div>
      <div className="cart-item-controls">
        <button
          className="cart-item-btn"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        >
          <Minus size={14} />
        </button>
        <span className="cart-item-qty">{item.quantity}</span>
        <button
          className="cart-item-btn"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <Plus size={14} />
        </button>
      </div>
      <span className="cart-item-total">
        {discount > 0 && <small style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>{formatCurrency(itemTotal, currency)}</small>}
        {formatCurrency(finalTotal, currency)}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {onUpdateDiscount && (
          <button
            className="cart-item-btn"
            onClick={() => setShowDiscount(!showDiscount)}
            title="Descuento"
            style={{ color: discount > 0 ? 'var(--color-danger)' : undefined }}
          >
            <Percent size={12} />
          </button>
        )}
        <button className="cart-item-remove" onClick={() => onRemove(item.id)}>
          <Trash2 size={14} />
        </button>
      </div>
      {showDiscount && onUpdateDiscount && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', paddingLeft: '4px' }}>
          <input
            type="number"
            value={discount}
            onChange={(e) => onUpdateDiscount(item.id, Number(e.target.value))}
            min="0"
            max="100"
            step="1"
            style={{ width: '60px', padding: '2px 6px', fontSize: '0.75rem' }}
            placeholder="0"
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>% desc.</span>
          {[5, 10, 15, 20].map(d => (
            <button
              key={d}
              className="btn btn-ghost"
              style={{ padding: '1px 6px', fontSize: '0.65rem', minHeight: 'auto' }}
              onClick={() => onUpdateDiscount(item.id, d)}
            >
              {d}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
