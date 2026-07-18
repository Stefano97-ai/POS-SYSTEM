import { useState } from 'react';
import Modal from '../Modal';

export default function EntradaModal({ isOpen, onClose, product, onSubmit, processing }) {
  const [cantidad, setCantidad] = useState(1);
  const [precioCosto, setPrecioCosto] = useState(0);

  const handleClose = () => {
    setCantidad(1);
    setPrecioCosto(0);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ cantidad, precioCosto });
    setCantidad(1);
    setPrecioCosto(0);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Entrada de Stock: ${product?.name || ''}`}>
      {product && (
        <form onSubmit={handleSubmit}>
          <div className="nc-ref-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stock Actual:</span>
              <strong style={{ fontSize: '1.25rem' }}>{product.stock || 0}</strong>
            </div>
            {cantidad > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #2D2D44' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Nuevo Stock:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>{(product.stock || 0) + cantidad}</strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Cantidad a ingresar *</label>
            <input
              type="number"
              min="1"
              required
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Precio de Costo (unitario)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={precioCosto}
              onChange={(e) => setPrecioCosto(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={processing || cantidad <= 0}>
              {processing ? 'Registrando...' : 'Registrar Entrada'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
