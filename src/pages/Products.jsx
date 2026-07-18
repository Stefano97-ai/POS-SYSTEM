import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ProductFormModal from '../components/products/ProductFormModal';

export default function Products() {
  const { state, dispatch } = useApp();
  const { products, categories, settings } = state;
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [processing, setProcessing] = useState(false);

  const catName = (c) => (typeof c === 'string' ? c : c?.nombre || '');

  const filtered = products.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      p.barcode.toLowerCase().includes(term) ||
      (p.modelo || '').toLowerCase().includes(term);
    const matchCat = filterCategory === 'Todos' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const stockBajo = products.filter((p) => p.stock <= (p.stockMinimo || 5));

  // Returns a valid UUID categoriaId or null — prevents sending a category name string as ID
  const resolveCategoriaId = (value) => {
    if (!value) return null;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_RE.test(value)) return value;
    const match = categories.find((c) => typeof c === 'object' && c.nombre === value);
    return match ? match.id : null;
  };

  const handleSave = async (form) => {
    setProcessing(true);
    const payload = {
      nombre: form.name,
      descripcion: form.descripcion,
      categoriaId: resolveCategoriaId(form.categoryId),
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
        showToast('Producto actualizado');
      } else {
        const saved = await api.createProduct(payload);
        dispatch({ type: 'ADD_PRODUCT', payload: saved });
        showToast('Producto registrado');
      }
      setShowModal(false);
    } catch (e) {
      showToast('Error al guardar: ' + (e.response?.data?.message || e.message), 'error');
    }
    setProcessing(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.deleteProduct(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      showToast('Producto eliminado');
    } catch (e) {
      showToast('Error al eliminar: ' + (e.response?.data?.message || e.message), 'error');
    }
  };

  return (
    <div className="data-page-premium">
      {/* Header Premium */}
      <div className="page-header-premium">
        <div className="title-area">
          <h1>Productos</h1>
          <p>{products.length} productos registrados</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
          onClick={() => { setEditProduct(null); setShowModal(true); }}
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Alerta Premium */}
      {stockBajo.length > 0 && (
        <div className="alert-bar-premium warning">
          <AlertTriangle size={20} />
          <span><strong>{stockBajo.length}</strong> producto(s) con stock bajo o agotado</span>
        </div>
      )}

      {/* Glass Card Container */}
      <div className="data-card-premium">
        {/* Toolbar Premium */}
        <div className="toolbar-premium">
          <div className="search-bar">
            <Search size={18} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Buscar por nombre, código, modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filters">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="Todos">Todas las categorías</option>
          {categories.map((c) => (
            <option key={catName(c)} value={catName(c)}>{catName(c)}</option>
          ))}
          </select>
        </div>
        </div>

        {/* Table Premium */}
        <div className="table-container-premium">
          <table className="table-premium">
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
                const stockClass =
                  product.stock <= 0 ? 'danger'
                  : product.stock <= stockMin ? 'warning'
                  : 'success';
                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'var(--color-bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                          <Package size={18} />
                        </div>
                        <div>
                          <span className="cell-primary">{product.name}</span>
                          {product.material && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{product.material}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-premium neutral">{product.category || '—'}</span></td>
                    <td className="cell-muted">
                    {[product.modelo, product.tamanio, product.color].filter(Boolean).join(' / ') || '—'}
                  </td>
                    <td className="cell-muted">
                      {product.precioCompra ? formatCurrency(product.precioCompra, settings.currency) : '—'}
                    </td>
                    <td className="cell-currency">{formatCurrency(product.price, settings.currency)}</td>
                    <td>
                      <span className={`badge-premium ${stockClass}`}>
                        {product.stock} {product.unidadMedida || 'u.'}
                        {product.stock <= stockMin && product.stock > 0 && <span style={{ fontSize: '0.65rem', marginLeft: '4px', opacity: 0.8 }}>(mín: {stockMin})</span>}
                      </span>
                    </td>
                    <td className="cell-muted">{product.barcode || '—'}</td>
                    <td>
                      <div className="action-cell">
                        <button className="btn-action-premium edit" onClick={() => { setEditProduct(product); setShowModal(true); }} title="Editar">
                          <Edit size={16} />
                        </button>
                        <button className="btn-action-premium delete" onClick={() => handleDelete(product.id)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        editProduct={editProduct}
        categories={categories}
        processing={processing}
      />

      {toast && (
        <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
