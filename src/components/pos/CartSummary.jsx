import { useState } from 'react';
import { CreditCard, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';

export default function CartSummary({ valorVenta, igv, descuentoTotal, total, onCheckout, currency }) {
  const { state, dispatch } = useApp();
  const { globalDiscount } = state;
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false);

  return (
    <div className="cart-summary-premium">
      <div className="summary-row">
        <span>Op. Gravada</span>
        <span>{formatCurrency(valorVenta, currency)}</span>
      </div>
      <div className="summary-row">
        <span>IGV (18%)</span>
        <span>{formatCurrency(igv, currency)}</span>
      </div>
      {descuentoTotal > 0 && (
        <div className="summary-row" style={{ color: 'var(--color-danger)' }}>
          <span>Descuento</span>
          <span>-{formatCurrency(descuentoTotal, currency)}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowGlobalDiscount(!showGlobalDiscount)}
          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
        >
          <Percent size={12} /> Desc. global
        </button>
        {showGlobalDiscount && (
          <>
            <input
              type="number"
              value={globalDiscount}
              onChange={(e) => dispatch({ type: 'SET_GLOBAL_DISCOUNT', payload: Number(e.target.value) })}
              min="0" max="100" step="1"
              style={{ width: '50px', padding: '2px 6px', fontSize: '0.75rem' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>%</span>
          </>
        )}
      </div>
      <div className="summary-row total">
        <span>Total</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
      <button className="btn-pay-premium" onClick={onCheckout}>
        <CreditCard size={20} /> Cobrar (F12)
      </button>
    </div>
  );
}
