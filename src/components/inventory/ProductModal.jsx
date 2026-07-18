import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { api } from '../../services/api';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, product, categories, onSubmit, processing }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoriaId: '',
    precioCompra: 0,
    precioVenta: 0,
    stock: 0,
    stockMinimo: 5,
    unidadMedida: 'UND',
    modelo: '',
    codigoBarras: '',
  });

  const [skuStatus, setSkuStatus] = useState({ loading: false, exists: false, error: null });
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  useEffect(() => {
    if (product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        codigo: product.codigo || '',
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        categoriaId: product.categoriaId || '',
        precioCompra: product.precioCompra || 0,
        precioVenta: product.precioVenta || 0,
        stock: product.stock || 0,
        stockMinimo: product.stockMinimo || 5,
        unidadMedida: product.unidadMedida || 'UND',
        modelo: product.modelo || '',
        codigoBarras: product.codigoBarras || '',
      });
    } else {
      setFormData({
        codigo: '', nombre: '', descripcion: '', categoriaId: '',
        precioCompra: 0, precioVenta: 0, stock: 0, stockMinimo: 5,
        unidadMedida: 'UND', modelo: '', codigoBarras: '',
      });
    }
    setSkuStatus({ loading: false, exists: false, error: null });
    setShowPriceWarning(false);
  }, [product, isOpen]);

  // CAMBIO N°1: Verificación de SKU en tiempo real
  useEffect(() => {
    if (!formData.codigo || (product && formData.codigo === product.codigo)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSkuStatus({ loading: false, exists: false, error: null });
      return;
    }

    const timer = setTimeout(async () => {
      setSkuStatus(prev => ({ ...prev, loading: true }));
      try {
        const exists = await api.verificarSku(formData.codigo);
        setSkuStatus({ loading: false, exists, error: null });
      } catch {
        setSkuStatus({ loading: false, exists: false, error: 'Error verificando' });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.codigo, product]);

  const handleSuggestSKU = async () => {
    try {
      const sugerido = await api.sugerirCodigo(formData.categoriaId);
      setFormData(prev => ({ ...prev, codigo: sugerido }));
    } catch (error) {
      console.error('Error sugiriendo SKU:', error);
    }
  };

  const validateSkuFormat = (sku) => {
    // Patrón: [3 LETRAS]-[3 DIGITOS] -> Ej: MAL-001
    const regex = /^[A-Z]{3}-\d{3}$/;
    return regex.test(sku);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // CAMBIO N°3: Validación de formato
    if (!validateSkuFormat(formData.codigo)) {
      alert('Formato de SKU inválido. Debe ser: CAT-000 (Ej: MAL-001)');
      return;
    }

    if (skuStatus.exists) {
      alert('El SKU ya existe. No se puede guardar.');
      return;
    }

    // CAMBIO N°2: Advertencia de precio
    if (formData.precioVenta < formData.precioCompra && !showPriceWarning) {
      setShowPriceWarning(true);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Editar Producto' : 'Nuevo Producto'}>
      <form onSubmit={handleSubmit} className="product-form">
        {showPriceWarning && (
          <div className="price-warning-box">
            <AlertTriangle size={20} />
            <div>
              <strong>⚠️ Advertencia de Precio</strong>
              <p>El precio de venta ({formData.precioVenta}) es menor al de costo ({formData.precioCompra}). Estarías vendiendo con pérdida.</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onSubmit(formData)}>Sí, guardar de todos modos</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPriceWarning(false)}>Revisar precios</button>
              </div>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group flex-2">
            <label>Nombre del Producto *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Maleta de Viaje Grande"
            />
          </div>
          <div className="form-group flex-1">
            <label>Categoría</label>
            <select
              value={formData.categoriaId}
              onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
            >
              <option value="">Seleccionar...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label>SKU / Código (CAT-000) *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  required
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  placeholder="MAL-001"
                  style={{ 
                    borderColor: skuStatus.exists ? 'var(--color-danger)' : 
                               (formData.codigo && validateSkuFormat(formData.codigo) ? 'var(--color-success)' : undefined) 
                  }}
                />
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  {skuStatus.loading ? <div className="spinning" style={{ width: '14px', height: '14px', border: '2px solid #ccc', borderTopColor: '#333', borderRadius: '50%' }} /> :
                   skuStatus.exists ? <XCircle size={16} style={{ color: 'var(--color-danger)' }} title="SKU Duplicado" /> :
                   (formData.codigo && validateSkuFormat(formData.codigo) && !skuStatus.exists) ? <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} /> : null}
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleSuggestSKU} title="Sugerir SKU basado en categoría">
                Sugerir
              </button>
            </div>
            {skuStatus.exists && <span style={{ color: 'var(--color-danger)', fontSize: '0.65rem' }}>Este SKU ya está en uso.</span>}
            {formData.codigo && !validateSkuFormat(formData.codigo) && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>Formato sugerido: XXX-000</span>}
          </div>
          <div className="form-group flex-1">
            <label>Código de Barras</label>
            <input
              type="text"
              value={formData.codigoBarras}
              onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Precio Compra (S/)</label>
            <input
              type="number"
              step="0.01"
              value={formData.precioCompra}
              onChange={(e) => setFormData({ ...formData, precioCompra: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>Precio Venta (S/) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.precioVenta}
              onChange={(e) => setFormData({ ...formData, precioVenta: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label>Modelo</label>
            <input
              type="text"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            />
          </div>
        </div>

        {!product && (
          <div className="form-row">
            <div className="form-group">
              <label>Stock Inicial</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Stock Mínimo</label>
              <input
                type="number"
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={processing || skuStatus.exists}>
            {processing ? 'Guardando...' : (product ? 'Actualizar' : 'Crear Producto')}
          </button>
        </div>
      </form>
      <style jsx>{`
        .product-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .form-row { display: flex; gap: 1rem; }
        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }
        .price-warning-box { 
          background: rgba(243, 156, 18, 0.1); 
          border: 1px solid var(--color-warning); 
          padding: 12px; 
          border-radius: 8px; 
          display: flex; 
          gap: 12px;
          margin-bottom: 8px;
          color: #fff;
        }
        .price-warning-box p { font-size: 0.8rem; margin: 4px 0 0; opacity: 0.9; }
      `}</style>
    </Modal>
  );
}
