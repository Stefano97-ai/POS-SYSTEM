import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatCurrency, getStockLevel, normalizeProduct } from '../utils/helpers';
import { Search, Plus, AlertCircle, AlertTriangle, CheckCircle2, Trash2, Edit2, Package } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import KardexPanel from '../components/inventory/KardexPanel';
import EntradaModal from '../components/inventory/EntradaModal';
import SalidaModal from '../components/inventory/SalidaModal';
import AjusteModal from '../components/inventory/AjusteModal';
import ProductModal from '../components/inventory/ProductModal';

const STOCK_FILTER_OPTIONS = [
  { value: '', label: 'Todo el stock' },
  { value: 'critical', label: 'Agotados (0)' },
  { value: 'low', label: 'Stock Bajo' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alto (50+)' },
];

export default function Inventory() {
  const { state, dispatch } = useApp();
  const { products, settings } = state;
  const currency = settings.currency || 'S/.';

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [kardex, setKardex] = useState([]);
  const [loadingKardex, setLoadingKardex] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  
  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [processing, setProcessing] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    api.getCategorias().then(setDbCategories).catch(() => {});
  }, []);

  // CAMBIO N°3: Diferenciar Stock Bajo de Agotado
  const stats = useMemo(() => {
    const critical = products.filter((p) => (p.stock || 0) === 0).length;
    const low = products.filter((p) => { 
      const s = p.stock || 0; 
      return s > 0 && s <= (p.stockMinimo || 5); 
    }).length;
    const totalItems = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.costPrice || 0), 0);
    const saleValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || 0), 0);
    return { critical, low, totalItems, totalValue, saleValue, alertCount: critical + low };
  }, [products]);

  const categoriesList = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || 'Sin categoría'));
    return Array.from(cats);
  }, [products]);

  // CAMBIO N°6 y N°7: Ordenamiento prioritario y Badges
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.modelo || '').toLowerCase().includes(q);
      const matchCategory = !categoryFilter || p.category === categoryFilter;
      const level = getStockLevel(p);
      let matchStock = true;
      if (stockFilter === 'critical') matchStock = (p.stock || 0) === 0;
      else if (stockFilter === 'low') matchStock = level === 'low';
      else if (stockFilter === 'normal') matchStock = level === 'medium' || level === 'good';
      else if (stockFilter === 'high') matchStock = (p.stock || 0) >= 50;
      return matchSearch && matchCategory && matchStock;
    }).sort((a, b) => {
      // 1. Agotados primero
      const isAgotadoA = (a.stock || 0) === 0;
      const isAgotadoB = (b.stock || 0) === 0;
      if (isAgotadoA && !isAgotadoB) return -1;
      if (isAgotadoB && !isAgotadoA) return 1;

      // 2. Luego Stock Bajo
      const isLowA = getStockLevel(a) === 'low';
      const isLowB = getStockLevel(b) === 'low';
      if (isLowA && !isLowB) return -1;
      if (isLowB && !isLowA) return 1;

      // 3. Alfabético
      return a.name.localeCompare(b.name);
    });
  }, [products, search, categoryFilter, stockFilter]);

  const loadKardex = async (productId) => {
    if (!productId) return;
    setLoadingKardex(true);
    try {
      const data = await api.getKardex(productId);
      setKardex(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading Kardex:', err);
      setKardex([]);
    }
    setLoadingKardex(false);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    loadKardex(product.id);
  };

  const handleCreateProduct = async (formData) => {
    setProcessing(true);
    try {
      const newProd = await api.createProducto(formData);
      dispatch({ type: 'ADD_PRODUCT', payload: normalizeProduct(newProd) });
      showToast('Producto creado con éxito');
      setShowProductModal(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al crear producto', 'error');
    }
    setProcessing(false);
  };

  const handleUpdateProduct = async (formData) => {
    if (!editingProduct) return;
    setProcessing(true);
    try {
      const updated = await api.updateProducto(editingProduct.id, formData);
      const normalized = normalizeProduct(updated);
      dispatch({ type: 'UPDATE_PRODUCT', payload: normalized });
      if (selectedProduct?.id === editingProduct.id) setSelectedProduct(normalized);
      showToast('Producto actualizado');
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al actualizar', 'error');
    }
    setProcessing(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este producto permanentemente? Esta acción limpiará el catálogo y no se puede deshacer.')) return;
    try {
      await api.deleteProducto(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
        setKardex([]);
      }
      showToast('Producto eliminado del catálogo');
    } catch { showToast('Error al eliminar producto', 'error'); }
  };

  const handleStockEntry = async ({ cantidad, precioCosto }) => {
    if (!selectedProduct) return;
    setProcessing(true);
    try {
      await api.entradaStock({ productoId: selectedProduct.id, cantidad, precioUnitario: precioCosto || null, motivo: 'Entrada Manual' });
      const updated = { ...selectedProduct, stock: selectedProduct.stock + cantidad, costPrice: precioCosto || selectedProduct.costPrice };
      const pId = selectedProduct.id;
      dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
      setSelectedProduct(updated);
      setTimeout(() => loadKardex(pId), 400);
      setShowEntradaModal(false);
      showToast(`+${cantidad} unidades ingresadas`);
    } catch { showToast('Error registrando entrada', 'error'); }
    setProcessing(false);
  };

  const handleStockExit = async ({ cantidad, motivo, observacion }) => {
    if (!selectedProduct) return;
    setProcessing(true);
    try {
      await api.salidaStock({ productoId: selectedProduct.id, cantidad, motivo, observacion });
      const updated = { ...selectedProduct, stock: Math.max(0, selectedProduct.stock - cantidad) };
      const pId = selectedProduct.id;
      dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
      setSelectedProduct(updated);
      setTimeout(() => loadKardex(pId), 400);
      setShowSalidaModal(false);
      showToast(`-${cantidad} unidades retiradas (${motivo})`);
    } catch { showToast('Error registrando salida', 'error'); }
    setProcessing(false);
  };

  const handleStockAdjustment = async ({ cantidad, tipoAjuste, motivo }) => {
    if (!selectedProduct) return;
    setProcessing(true);
    try {
      await api.ajusteStock({ productoId: selectedProduct.id, cantidad, tipo: tipoAjuste, motivo });
      const diff = tipoAjuste === 'INCREMENTO' ? cantidad : -cantidad;
      const updated = { ...selectedProduct, stock: Math.max(0, selectedProduct.stock + diff) };
      const pId = selectedProduct.id;
      dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
      setSelectedProduct(updated);
      setTimeout(() => loadKardex(pId), 400);
      setShowAjusteModal(false);
      showToast('Ajuste de inventario realizado');
    } catch { showToast('Error registrando ajuste', 'error'); }
    setProcessing(false);
  };

  return (
    <div className="data-page-premium">
      <div className="page-header-premium">
        <div className="title-area">
          <h1>Gestión de Inventario</h1>
          <p>Control de existencias y trazabilidad de movimientos</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {stats.alertCount > 0 && (
            <div className="alert-bar-premium warning" style={{ padding: '0.5rem 1rem' }}>
              <AlertCircle size={18} />
              <span>{stats.low} stock bajo, {stats.critical} agotados</span>
            </div>
          )}
          {/* CAMBIO N°5: Botón + Nuevo Producto */}
          <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="billing-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Stock Total', value: stats.totalItems.toLocaleString(), accent: true },
          { label: 'Valor Inversión', value: formatCurrency(stats.totalValue, currency) },
          { label: 'Estimado Venta', value: formatCurrency(stats.saleValue, currency), success: true },
          { label: 'Productos', value: products.length },
          { label: 'STOCK BAJO', value: stats.low, warn: stats.low > 0 },
          { label: 'AGOTADOS', value: stats.critical, danger: stats.critical > 0 },
        ].map(({ label, value, accent, danger, warn, success }) => (
          <div key={label} className="billing-stat-card">
            <span className="billing-stat-label">{label}</span>
            <span className="billing-stat-value" style={{ 
              color: accent ? 'var(--color-accent)' : 
                     danger ? 'var(--color-danger)' : 
                     warn ? '#F39C12' : 
                     success ? 'var(--color-success)' : undefined 
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="inv-layout">
        <div className="inv-sidebar">
          <div className="inv-sidebar-search">
            <div className="toolbar-search">
              <Search size={16} />
              <input type="text" placeholder="Buscar por nombre, SKU, modelo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="inv-sidebar-filters">
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={{ fontSize: '0.75rem', padding: '4px 6px' }}>
              {STOCK_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ fontSize: '0.75rem', padding: '4px 6px' }}>
              <option value="">Categorías</option>
              {categoriesList.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="inv-product-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const level = getStockLevel(p);
                const isAgotado = (p.stock || 0) === 0;
                return (
                  <div key={p.id} className={`inv-product-item ${selectedProduct?.id === p.id ? 'selected' : ''}`} onClick={() => handleSelectProduct(p)}>
                    <div className="inv-product-item-info">
                      <span className="inv-product-item-name">{p.name}</span>
                      <span className="inv-product-item-code">{p.codigo || p.barcode || 'S/C'}</span>
                    </div>
                    {/* CAMBIO N°5: Badges de colores específicos */}
                    <div className="inv-product-item-stock">
                      <span className="stock-badge" style={{ 
                        backgroundColor: isAgotado ? '#DC2626' : (level === 'low' ? '#F59E0B' : '#10B981'),
                        color: 'white',
                        fontWeight: 700
                      }}>
                        {p.stock || 0}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                No se encontraron productos
              </div>
            )}
          </div>
        </div>

        <div className="inv-content">
          <KardexPanel
            selectedProduct={selectedProduct}
            kardex={kardex}
            loadingKardex={loadingKardex}
            currency={currency}
            onRefresh={() => loadKardex(selectedProduct.id)}
            onEntrada={() => setShowEntradaModal(true)}
            onSalida={() => setShowSalidaModal(true)}
            onAjuste={() => setShowAjusteModal(true)}
            onEdit={() => { setEditingProduct(selectedProduct); setShowProductModal(true); }}
            onDelete={() => handleDeleteProduct(selectedProduct.id)}
          />

          {!selectedProduct && (
            <div className="inv-empty-detail">
               <Package size={56} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
               <h3 style={{ margin: '0.75rem 0 0.25rem' }}>Gestión de Inventario</h3>
               <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Seleccione un producto para ver detalles y movimientos.</p>
            </div>
          )}
        </div>
      </div>

      <ProductModal 
        isOpen={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        product={editingProduct} 
        categories={dbCategories}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} 
        processing={processing} 
      />
      
      <EntradaModal isOpen={showEntradaModal} onClose={() => setShowEntradaModal(false)} product={selectedProduct} onSubmit={handleStockEntry} processing={processing} />
      <SalidaModal isOpen={showSalidaModal} onClose={() => setShowSalidaModal(false)} product={selectedProduct} onSubmit={handleStockExit} processing={processing} />
      <AjusteModal isOpen={showAjusteModal} onClose={() => setShowAjusteModal(false)} product={selectedProduct} onSubmit={handleStockAdjustment} processing={processing} />

      {toast && (
        <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
