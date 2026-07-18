import { useState } from 'react';
import { AlertTriangle, Plus, Minus } from 'lucide-react';
import Modal from '../Modal';

export default function AjusteModal({ isOpen, onClose, product, onSubmit, processing }) {
  const [cantidad, setCantidad] = useState(1);
  const [tipoAjuste, setTipoAjuste] = useState('INCREMENTO');
  const [motivo, setMotivo] = useState('');

  const handleClose = () => {
    setCantidad(1);
    setTipoAjuste('INCREMENTO');
    setMotivo('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ cantidad, tipoAjuste, motivo });
    setCantidad(1);
    setTipoAjuste('INCREMENTO');
    setMotivo('');
  };

  const newStock = Math.max(0, (product?.stock || 0) + (tipoAjuste === 'INCREMENTO' ? cantidad : -cantidad));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Ajuste de Stock: ${product?.name || ''}`}>
      {product && (
        <form onSubmit={handleSubmit}>
          <div className="nc-ref-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stock Actual:</span>
              <strong style={{ fontSize: '1.25rem' }}>{product.stock || 0}</strong>
            </div>
            {cantidad > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #2D2D44' }}>
                <span style={{ fontSize: '0.8rem', color: tipoAjuste === 'INCREMENTO' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  Nuevo Stock:
                </span>
                <strong style={{ fontSize: '1.25rem', color: tipoAjuste === 'INCREMENTO' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {newStock}
                </strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Tipo de Ajuste</label>
            <div className="inv-ajuste-toggle">
              <button
                type="button"
                className={`inv-ajuste-btn ${tipoAjuste === 'INCREMENTO' ? 'active incremento' : ''}`}
                onClick={() => setTipoAjuste('INCREMENTO')}
              >
                <Plus size={16} /> Incremento
              </button>
              <button
                type="button"
                className={`inv-ajuste-btn ${tipoAjuste === 'DECREMENTO' ? 'active decremento' : ''}`}
                onClick={() => setTipoAjuste('DECREMENTO')}
              >
                <Minus size={16} /> Decremento
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Cantidad *</label>
            <input
              type="number"
              min="1"
              required
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="form-group">
            <label>Motivo del Ajuste *</label>
            <textarea
              required
              rows={3}
              placeholder="Ej: Inventario real difiere de sistema, producto dañado, devolución..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {tipoAjuste === 'DECREMENTO' && cantidad > (product.stock || 0) && (
            <div className="nc-warning">
              <AlertTriangle size={16} />
              <span>La cantidad supera el stock actual. El stock quedará en 0.</span>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancelar</button>
            <button
              type="submit"
              className={`btn ${tipoAjuste === 'DECREMENTO' ? 'btn-danger' : 'btn-primary'}`}
              disabled={processing || cantidad <= 0 || !motivo.trim()}
            >
              {processing ? 'Procesando...' : 'Aplicar Ajuste'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
