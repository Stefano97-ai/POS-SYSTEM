import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';

export default function Products() {
  const { state, dispatch } = useApp();
  const { products, categories, settings } = state;

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    name: '', price: '', category: '', stock: '', barcode: '',
    modelo: '', tamanio: '', color: '', material: '',
    precioCompra: '', stockMinimo: '5', descripcion: '', unidadMedida: 'UND',
  });

  const catName = (c) => typeof c === 'string' ? c : (c?.nombre || '');

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch = p.nombre?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.codigoBarras?.toLowerCase().includes(term) ||
      p.codigo?.toLowerCase().includes(term) ||
      p.modelo?.toLowerCase().includes(term);
    const matchCat = filterCategory === 'Todos' || p.categoriaNombre === filterCategory || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const stockBajo = products.filter(p => p.stock <= (p.stockMinimo || 5));

  const firstCatId = () => {
    const c = categories[0];
    return c ? (typeof c === 'string' ? c : c.id) : '';
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm({
      name: '', price: '', categoryId: firstCatId(), stock: '', barcode: '',
      modelo: '', tamanio: '', color: '', material: '',
      precioCompra: '', stockMinimo: '5', descripcion: '', unidadMedida: 'UND',
    });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.nombre || product.name || '',
      price: product.precioVenta || product.price || '',
      categoryId: product.categoriaId || '',
      stock: product.stock || 0,
      barcode: product.codigoBarras || product.barcode || '',
      modelo: product.modelo || '',
      tamanio: product.tamanio || '',
      color: product.color || '',
      material: product.material || '',
      precioCompra: product.precioCompra || '',
      stockMinimo: product.stockMinimo || 5,
      descripcion: product.descripcion || '',
      unidadMedida: product.unidadMedida || 'UND',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    const payload = {
      nombre: form.name,
      descripcion: form.descripcion,
      categoriaId: form.categoryId || null,
      precioVenta: Number(form.price),
      precioCompra: Number(form.precioCompra) || 0,
      stock: Number(form.stock) || 0,
      stockMinimo: Number(form.stockMinimo) || 5,
      unidadMedida: form.unidadMedida,
      modelo: form.modelo,
      tamanio: form.tamanio,
      color: form.color,
      material: form.material,
      codigoBarras: form.barcode || null,
    };

    try {
      if (editProduct) {
        const saved = await api.updateProduct(editProduct.id, payload);
        dispatch({ type: 'UPDATE_PRODUCT', payload: saved });
      } else {
        const saved = await api.createProduct(payload);
        dispatch({ type: 'ADD_PRODUCT', payload: saved });
      }
      setShowModal(false);
    } catch (e) {
      alert("Error al guardar: " + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await api.deleteProduct(id);
        dispatch({ type: 'DELETE_PRODUCT', payload: id });
      } catch (e) {
        alert("Error al eliminar: " + (e.response?.data?.message || e.message));
      }
    }
  };

  return (
    <div className="products-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">{products.length} productos registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {stockBajo.length > 0 && (
        <div className="stock-alert">
          <AlertTriangle size={18} />
          <span><strong>{stockBajo.length}</strong> producto(s) con stock bajo o agotado</span>
        </div>
      )}

      <div className="products-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, código, modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="Todos">Todas las categorías</option>
          {categories.map((c) => (
            <option key={catName(c)} value={catName(c)}>{catName(c)}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Modelo / Variación</th>
              <th>P. Compra</th>
              <th>P. Venta</th>
              <th>Stock</th>
              <th>Código</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const stockMin = product.stockMinimo || 5;
              const stockClass = product.stock <= 0 ? 'critical' : product.stock <= stockMin ? 'low' : product.stock <= stockMin * 2 ? 'medium' : 'good';
              return (
                <tr key={product.id}>
                  <td>
                    <div className="product-name-cell">
                      <Package size={16} />
                      <div>
                        <span>{product.name || product.nombre}</span>
                        {product.material && <small className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>{product.material}</small>}
                      </div>
                    </div>
                  </td>
                  <td><span className="category-tag">{product.category || product.categoriaNombre}</span></td>
                  <td className="text-muted">
                    {[product.modelo, product.tamanio, product.color].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="text-muted">{product.precioCompra ? formatCurrency(product.precioCompra, settings.currency) : '—'}</td>
                  <td className="text-accent">{formatCurrency(product.price || product.precioVenta, settings.currency)}</td>
                  <td>
                    <span className={`stock-badge ${stockClass}`}>
                      {product.stock}
                      {product.stock <= stockMin && product.stock > 0 && <small> (mín: {stockMin})</small>}
                    </span>
                  </td>
                  <td className="text-muted">{product.barcode || product.codigo || product.codigoBarras || '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(product)} title="Editar">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(product.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Maleta de Viaje Grande" />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del producto (opcional)" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Categoría</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => {
                const id = typeof c === 'string' ? c : c.id;
                return <option key={id} value={id}>{catName(c)}</option>;
              })}
            </select>
          </div>
          <div className="form-group">
            <label>Unidad de Medida</label>
            <select value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}>
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
            <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ej: Viajero Plus" />
          </div>
          <div className="form-group">
            <label>Tamaño</label>
            <input value={form.tamanio} onChange={(e) => setForm({ ...form, tamanio: e.target.value })} placeholder="Ej: Grande, Mediano" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Color</label>
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ej: Negro, Azul" />
          </div>
          <div className="form-group">
            <label>Material</label>
            <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="Ej: Cuero sintético, Lona" />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0', paddingTop: '12px' }}>
          <small style={{ color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Precios y stock</small>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Precio de Compra (S/.)</label>
            <input type="number" value={form.precioCompra} onChange={(e) => setForm({ ...form, precioCompra: e.target.value })} placeholder="0.00" step="0.01" min="0" />
          </div>
          <div className="form-group">
            <label>Precio de Venta (S/.)</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" step="0.01" min="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Stock Actual</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label>Stock Mínimo</label>
            <input type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} placeholder="5" min="0" />
          </div>
        </div>
        <div className="form-group">
          <label>Código de Barras / Código Interno</label>
          <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Ej: MAL-001" />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {editProduct ? 'Guardar Cambios' : 'Agregar Producto'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
