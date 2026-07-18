import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import { formatCurrency, formatShortDate, getTipoComprobanteLabel } from '../../utils/helpers';

export default function NotaCreditoModal({ sale, onClose, onSubmit, processing, currency }) {
  const [motivo, setMotivo] = useState('');
  const [tipo, setTipo] = useState('ANULACION_TOTAL');

  const handleClose = () => {
    setMotivo('');
    setTipo('ANULACION_TOTAL');
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(motivo, tipo);
    setMotivo('');
    setTipo('ANULACION_TOTAL');
  };

  if (!sale) return null;

  return (
    <Modal isOpen={!!sale} onClose={handleClose} title="Emitir Nota de Crédito">
      <div className="nc-ref-card">
        <div className="nc-ref-label">Comprobante de referencia</div>
        <div className="nc-ref-info">
          <span className={`tipo-badge tipo-${(sale.tipoComprobante || 'boleta').toLowerCase()}`}>
            {getTipoComprobanteLabel(sale.tipoComprobante || 'BOLETA')}
          </span>
          <strong>{sale.invoiceNumber || sale.numeroVenta}</strong>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            {formatShortDate(sale.date || sale.fechaEmision || sale.createdAt)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem' }}>
          <span>{sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'}</span>
          <strong className="text-accent">{formatCurrency(sale.total, currency)}</strong>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Tipo de nota de crédito</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="ANULACION_TOTAL">Anulación total de la operación</option>
          <option value="ANULACION_PARCIAL">Anulación parcial</option>
          <option value="DESCUENTO">Descuento por ítem</option>
          <option value="CORRECCION">Corrección por error</option>
        </select>
      </div>

      <div className="form-group">
        <label>Motivo *</label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Describa el motivo de la nota de crédito..."
          rows={3}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      {tipo === 'ANULACION_TOTAL' && (
        <div className="nc-warning">
          <AlertTriangle size={16} />
          <span>Se generará una Nota de Crédito por el total de {formatCurrency(sale.total, currency)}. Esta acción anulará el comprobante original.</span>
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
        <button className="btn btn-danger" onClick={handleSubmit} disabled={processing || !motivo.trim()}>
          {processing ? 'Procesando...' : 'Emitir Nota de Crédito'}
        </button>
      </div>
    </Modal>
  );
}
