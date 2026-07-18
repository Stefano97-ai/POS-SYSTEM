import { useState } from 'react';
import { Banknote, Smartphone, Building2, CreditCard, Clock, CheckCircle } from 'lucide-react';
import Modal from '../Modal';
import { formatCurrency } from '../../utils/helpers';

const METODOS_PAGO = [
  { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { key: 'YAPE_PLIN', label: 'Yape/Plin', icon: Smartphone },
  { key: 'TRANSFERENCIA', label: 'Transferencia', icon: Building2 },
  { key: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
  { key: 'CREDITO', label: 'Crédito', icon: Clock },
];

export default function POSPaymentModal({ isOpen, onClose, total, tipoComprobante, selectedCustomer, onComplete, currency }) {
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState('');

  const change = paymentMethod === 'EFECTIVO' && amountPaid ? Number(amountPaid) - total : 0;
  const canComplete = paymentMethod !== 'EFECTIVO' || (amountPaid && Number(amountPaid) >= total);

  const handleClose = () => {
    setPaymentMethod('EFECTIVO');
    setAmountPaid('');
    onClose();
  };

  const handleComplete = () => {
    const paid = paymentMethod !== 'EFECTIVO' ? total : Number(amountPaid);
    onComplete(paymentMethod, paid);
    setPaymentMethod('EFECTIVO');
    setAmountPaid('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Procesar Pago">
      <div className="payment-total">
        <span>Total a cobrar</span>
        <span className="payment-amount">{formatCurrency(total, currency)}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <span className="category-tag" style={{ fontSize: '0.85rem' }}>
          {tipoComprobante === 'BOLETA' ? 'Boleta de Venta' : tipoComprobante === 'FACTURA' ? 'Factura' : 'Nota de Venta'}
        </span>
        {selectedCustomer && (
          <span style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {selectedCustomer.name || selectedCustomer.nombre}
            {selectedCustomer.numeroDocumento && ` — ${selectedCustomer.tipoDocumento}: ${selectedCustomer.numeroDocumento}`}
          </span>
        )}
      </div>

      <div className="payment-methods">
        {/* eslint-disable-next-line no-unused-vars */}
        {METODOS_PAGO.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`payment-method-btn ${paymentMethod === key ? 'active' : ''}`}
            onClick={() => setPaymentMethod(key)}
          >
            <Icon size={24} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {paymentMethod === 'EFECTIVO' && (
        <div className="payment-cash">
          <div className="form-group">
            <label>Monto recibido</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
              min={total}
              step="0.01"
              autoFocus
            />
          </div>
          {amountPaid && Number(amountPaid) >= total && (
            <div className="payment-change">
              <span>Vuelto:</span>
              <span className="change-amount">{formatCurrency(change, currency)}</span>
            </div>
          )}
          <div className="quick-amounts">
            {[10, 20, 50, 100, 200].map((amt) => (
              <button key={amt} className="btn btn-ghost btn-sm" onClick={() => setAmountPaid(String(amt))}>
                {formatCurrency(amt, currency)}
              </button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setAmountPaid(String(Math.ceil(total)))}>
              Exacto
            </button>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
        <button className="btn btn-success btn-lg" onClick={handleComplete} disabled={!canComplete}>
          <CheckCircle size={18} /> Completar Venta
        </button>
      </div>
    </Modal>
  );
}
