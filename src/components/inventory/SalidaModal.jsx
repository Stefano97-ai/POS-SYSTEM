import { useState } from 'react';
import Modal from '../Modal';

const MOTIVOS_SALIDA = [
  { value: 'MERMA', label: 'Merma / Desperdicio' },
  { value: 'ROTURA', label: 'Rotura / Daño' },
  { value: 'ROBO', label: 'Robo / Pérdida' },
  { value: 'REGALO', label: 'Regalo / Promoción' },
  { value: 'VENCIMIENTO', label: 'Vencimiento' },
  { value: 'OTROS', label: 'Otros' },
];

export default function SalidaModal({ isOpen, onClose, product, onSubmit, processing }) {
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('MERMA');
  const [observacion, setObservacion] = useState('');

  const handleClose = () => {
    setCantidad(1);
    setMotivo('MERMA');
    setObservacion('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ cantidad, motivo, observacion });
    handleClose();
  };

  const stockInsuficiente = product && cantidad > (product.stock || 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Salida de Stock: ${product?.name || ''}`}>
      {product && (
        <form onSubmit={handleSubmit}>
          <div className="nc-ref-card" style={{ marginBottom: '1rem', background: 'rgba(255, 107, 107, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stock Actual:</span>
              <strong style={{ fontSize: '1.25rem' }}>{product.stock || 0}</strong>
            </div>
            {cantidad > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #2D2D44' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Nuevo Stock:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--color-danger)' }}>{Math.max(0, (product.stock || 0) - cantidad)}</strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Cantidad a retirar *</label>
            <input
              type="number"
              min="1"
              max={product.stock || 0}
              required
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
            />
            {stockInsuficiente && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.7rem', marginTop: '4px' }}>
                La cantidad supera el stock disponible.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Motivo de Salida *</label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} required>
              {MOTIVOS_SALIDA.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Observación / Referencia</label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej: Producto dañado en almacén..."
              rows={2}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="btn btn-danger" disabled={processing || cantidad <= 0 || stockInsuficiente}>
              {processing ? 'Registrando...' : 'Registrar Salida'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
