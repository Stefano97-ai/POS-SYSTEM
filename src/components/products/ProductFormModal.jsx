import { useState, useEffect } from 'react';
import Modal from '../Modal';

const EMPTY_FORM = {
  name: '', price: '', categoryId: '', stock: '', barcode: '',
  modelo: '', tamanio: '', color: '', material: '',
  precioCompra: '', stockMinimo: '5', descripcion: '', unidadMedida: 'UND',
};

const catName = (c) => (typeof c === 'string' ? c : c?.nombre || '');
const catId = (c) => (typeof c === 'string' ? c : c?.id || '');

export default function ProductFormModal({ isOpen, onClose, onSave, editProduct, categories, processing }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;
    if (editProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: editProduct.nombre || editProduct.name || '',
        price: editProduct.precioVenta || editProduct.price || '',
        categoryId: editProduct.categoriaId || '',
        stock: editProduct.stock || 0,
        barcode: editProduct.codigoBarras || editProduct.barcode || '',
        modelo: editProduct.modelo || '',
        tamanio: editProduct.tamanio || '',
        color: editProduct.color || '',
        material: editProduct.material || '',
        precioCompra: editProduct.precioCompra || '',
        stockMinimo: editProduct.stockMinimo || 5,
        descripcion: editProduct.descripcion || '',
        unidadMedida: editProduct.unidadMedida || 'UND',
      });
    } else {
      setForm({ ...EMPTY_FORM, categoryId: categories.length > 0 ? catId(categories[0]) : '' });
    }
  }, [isOpen, editProduct, categories]);

  // Resync categoryId when categories transition from strings to backend UUIDs
  useEffect(() => {
    if (!isOpen || categories.length === 0) return;
    const validIds = categories.map(catId);
    if (!validIds.includes(form.categoryId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, categoryId: catId(categories[0]) }));
    }
  }, [categories, isOpen, form.categoryId]);

  const set = (fields) => setForm((prev) => ({ ...prev, ...fields }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editProduct ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
      <div className="form-group">
        <label>Nombre del Producto</label>
        <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej: Maleta de Viaje Grande" />
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea rows={2} value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} placeholder="Descripción del producto (opcional)" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Categoría</label>
          <select value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={catId(c)} value={catId(c)}>{catName(c)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Unidad de Medida</label>
          <select value={form.unidadMedida} onChange={(e) => set({ unidadMedida: e.target.value })}>
            <option value="UND">Unidad (UND)</option>
            <option value="PAR">Par (PAR)</option>
            <option value="PAQ">Paquete (PAQ)</option>
            <option value="DOC">Docena (DOC)</option>
            <option value="MTS">Metros (MTS)</option>
          </select>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: '12px' }}>
        <small style={{ color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Variaciones del producto</small>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Modelo</label>
          <input value={form.modelo} onChange={(e) => set({ modelo: e.target.value })} placeholder="Ej: Viajero Plus" />
        </div>
        <div className="form-group">
          <label>Tamaño</label>
          <input value={form.tamanio} onChange={(e) => set({ tamanio: e.target.value })} placeholder="Ej: Grande, Mediano" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Color</label>
          <input value={form.color} onChange={(e) => set({ color: e.target.value })} placeholder="Ej: Negro, Azul" />
        </div>
        <div className="form-group">
          <label>Material</label>
          <input value={form.material} onChange={(e) => set({ material: e.target.value })} placeholder="Ej: Cuero sintético, Lona" />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: '12px' }}>
        <small style={{ color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Precios y stock</small>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Precio de Compra (S/.)</label>
          <input type="number" value={form.precioCompra} onChange={(e) => set({ precioCompra: e.target.value })} placeholder="0.00" step="0.01" min="0" />
        </div>
        <div className="form-group">
          <label>Precio de Venta (S/.)</label>
          <input type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="0.00" step="0.01" min="0" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Stock Actual</label>
          <input type="number" value={form.stock} onChange={(e) => set({ stock: e.target.value })} placeholder="0" min="0" />
        </div>
        <div className="form-group">
          <label>Stock Mínimo</label>
          <input type="number" value={form.stockMinimo} onChange={(e) => set({ stockMinimo: e.target.value })} placeholder="5" min="0" />
        </div>
      </div>
      <div className="form-group">
        <label>Código de Barras / Código Interno</label>
        <input value={form.barcode} onChange={(e) => set({ barcode: e.target.value })} placeholder="Ej: MAL-001" />
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={processing || !form.name || !form.price}>
          {processing ? 'Guardando...' : editProduct ? 'Guardar Cambios' : 'Agregar Producto'}
        </button>
      </div>
    </Modal>
  );
}
