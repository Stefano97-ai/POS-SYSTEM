import { useState } from 'react';
import Modal from '../Modal';
import { formatCurrency, formatShortDate, getTipoComprobanteLabel } from '../../utils/helpers';

export default function ComunicacionBajaModal({ isOpen, onClose, onSubmit, processing, sales, currency }) {
  const [motivo, setMotivo] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  const toggle = (id) => setSeleccionados((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const handleClose = () => {
    setMotivo('');
    setSeleccionados([]);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(seleccionados, motivo);
    setMotivo('');
    setSeleccionados([]);
  };

  const elegibles = sales.filter((s) => {
    const estado = s.estadoSunat || s.estado || 'PENDIENTE';
    const tipo = s.tipoComprobante || 'BOLETA';
    return estado !== 'ANULADO' && tipo !== 'NOTA_CREDITO' && tipo !== 'NOTA_DEBITO';
  }).slice(0, 20);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Comunicación de Baja" size="lg">
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sec)', marginBottom: '1rem' }}>
        La Comunicación de Baja permite dar de baja comprobantes emitidos con error.
        Seleccione los comprobantes e indique el motivo.
      </p>

      <div className="form-group">
        <label>Motivo de baja *</label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: Error en la emisión del comprobante"
          rows={2}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      <div className="form-group">
        <label>Seleccione comprobantes ({seleccionados.length} seleccionados)</label>
      </div>

      <div className="baja-list">
        {elegibles.map((sale) => (
          <label key={sale.id} className={`baja-item ${seleccionados.includes(sale.id) ? 'selected' : ''}`}>
            <input type="checkbox" checked={seleccionados.includes(sale.id)} onChange={() => toggle(sale.id)} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="invoice-badge">{sale.invoiceNumber || sale.numeroVenta}</span>
                <span className={`tipo-badge tipo-${(sale.tipoComprobante || 'boleta').toLowerCase()}`}>
                  {getTipoComprobanteLabel(sale.tipoComprobante || 'BOLETA')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'} — {formatCurrency(sale.total, currency)}
              </div>
            </div>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {formatShortDate(sale.date || sale.fechaEmision || sale.createdAt)}
            </span>
          </label>
        ))}
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
        <button className="btn btn-danger" onClick={handleSubmit} disabled={processing || seleccionados.length === 0 || !motivo.trim()}>
          {processing ? 'Enviando...' : `Dar de Baja (${seleccionados.length})`}
        </button>
      </div>
    </Modal>
  );
}
