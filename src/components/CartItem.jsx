// CAMBIO N°1: Layout totalmente rediseñado para evitar desbordamiento de texto
// CAMBIO N°2: Validación de stock al incrementar cantidad en carrito
import { Minus, Plus, Trash2, Percent } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../utils/helpers';

export default function CartItem({ item, onUpdateQuantity, onRemove, onUpdateDiscount, currency = 'S/.' }) {
  const [showDiscount, setShowDiscount] = useState(false);
  const price = item.price;
  const discount = item.discount || 0;
  const itemTotal = price * item.quantity;
  const discountAmount = itemTotal * (discount / 100);
  const finalTotal = itemTotal - discountAmount;

  // CAMBIO N°2: Verificar si se alcanzó el límite de stock
  const stockDisponible = item.stock ?? Infinity;
  const atMaxStock = item.quantity >= stockDisponible;

  const handleIncrement = () => {
    if (atMaxStock) return; // bloqueado silenciosamente, el botón ya está disabled
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  return (
    // CAMBIO N°1: Contenedor con overflow controlado
    <div className="cart-item" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
      {/* Fila 1: Nombre + botón eliminar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        {/* CAMBIO N°1: Nombre con máximo 2 líneas, ellipsis si supera */}
        <span style={{
          fontWeight: 600,
          fontSize: '0.82rem',
          lineHeight: '1.3',
          color: 'var(--color-text)',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }} title={item.name}>
          {item.name}
        </span>
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
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
          <button className="cart-item-remove" onClick={() => onRemove(item.id)} title="Eliminar del carrito">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Fila 2: Precio unitario */}
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        {formatCurrency(price, currency)} c/u
        {discount > 0 && (
          <span style={{ color: 'var(--color-danger)', marginLeft: '6px' }}>-{discount}%</span>
        )}
      </div>

      {/* Fila 3: Controles de cantidad + subtotal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* CAMBIO N°1: Controles de cantidad en fila alineada */}
        <div className="cart-item-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="cart-item-btn"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            <Minus size={14} />
          </button>
          <span className="cart-item-qty" style={{ minWidth: '28px', textAlign: 'center' }}>
            {item.quantity}
          </span>
          {/* CAMBIO N°2: Botón "+" deshabilitado cuando se alcanza el stock máximo */}
          <button
            className="cart-item-btn"
            onClick={handleIncrement}
            disabled={atMaxStock}
            title={atMaxStock ? `Máximo disponible: ${stockDisponible} unid.` : 'Aumentar cantidad'}
            style={atMaxStock ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
          >
            <Plus size={14} />
          </button>
          {/* CAMBIO N°2: Indicador visual cuando se llega al límite */}
          {atMaxStock && (
            <span style={{ fontSize: '0.65rem', color: '#F59E0B', marginLeft: '4px', whiteSpace: 'nowrap' }}>
              Máx.
            </span>
          )}
        </div>

        {/* Subtotal */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {discount > 0 && (
            <small style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>
              {formatCurrency(itemTotal, currency)}
            </small>
          )}
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
            {formatCurrency(finalTotal, currency)}
          </span>
        </div>
      </div>

      {/* Panel de descuento expandible */}
      {showDiscount && onUpdateDiscount && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px dashed var(--color-border)' }}>
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
