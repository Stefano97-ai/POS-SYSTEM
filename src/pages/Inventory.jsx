import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  AlertCircle,
  History,
  Package,
  ArrowRightLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from 'lucide-react';

const STOCK_FILTER_OPTIONS = [
  { value: '', label: 'Todo el stock' },
  { value: 'critical', label: 'Critico (0)' },
  { value: 'low', label: 'Bajo' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alto (50+)' },
];

function getStockLevel(product) {
  const stock = product.stock || 0;
  const min = product.stockMinimo || 5;
  if (stock === 0) return 'critical';
  if (stock <= min) return 'low';
  if (stock <= min * 2) return 'medium';
  return 'good';
}

export default function Inventory() {
  const { state, dispatch } = useApp();
  const { products, settings } = state;
  const currency = settings.currency || 'S/.';

  // Search and filters
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected product and kardex
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [kardex, setKardex] = useState([]);
  const [loadingKardex, setLoadingKardex] = useState(false);

  // Modals
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    cantidad: 1,
    motivo: '',
    proveedorId: '',
    precioCosto: 0,
    tipoAjuste: 'INCREMENTO',
  });

  // UI state
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Stats
  const stats = useMemo(() => {
    const critical = products.filter((p) => (p.stock || 0) === 0).length;
    const low = products.filter((p) => {
      const s = p.stock || 0;
      return s > 0 && s <= (p.stockMinimo || 5);
    }).length;
    const totalItems = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.stock || 0) * (p.price || p.precioVenta || 0), 0);
    return { critical, low, totalItems, totalValue, alertCount: critical + low };
  }, [products]);

  // Categories from products
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category || p.categoria || 'Sin categoría'));
    return ['', ...Array.from(cats)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const name = (p.name || p.nombre || '').toLowerCase();
      const code = (p.barcode || p.codigo || '').toLowerCase();
      const modelo = (p.modelo || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || code.includes(q) || modelo.includes(q);

      const cat = p.category || p.categoria || '';
      const matchCategory = !categoryFilter || cat === categoryFilter;

      const level = getStockLevel(p);
      let matchStock = true;
      if (stockFilter === 'critical') matchStock = (p.stock || 0) === 0;
      else if (stockFilter === 'low') matchStock = level === 'low' || level === 'critical';
      else if (stockFilter === 'normal') matchStock = level === 'medium' || level === 'good';
      else if (stockFilter === 'high') matchStock = (p.stock || 0) >= 50;

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // Low stock products for alert section
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => (p.stock || 0) <= (p.stockMinimo || 5))
      .sort((a, b) => (a.stock || 0) - (b.stock || 0));
  }, [products]);

  // Kardex
  const loadKardex = async (productId) => {
    setLoadingKardex(true);
    try {
      const data = await api.getKardex(productId);
      setKardex(Array.isArray(data) ? data : data.content || []);
    } catch {
      setKardex([]);
    }
    setLoadingKardex(false);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    loadKardex(product.id);
  };

  // Entrada de stock
  const handleStockEntry = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setProcessing(true);
    try {
      await api.entradaStock({
        productoId: selectedProduct.id,
        cantidad: formData.cantidad,
        precioCosto: formData.precioCosto || null,
        proveedorId: formData.proveedorId || null,
        documentoReferencia: 'ENTRADA MANUAL',
      });
      const updatedProduct = { ...selectedProduct, stock: selectedProduct.stock + formData.cantidad };
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      setSelectedProduct(updatedProduct);
      loadKardex(selectedProduct.id);
      setShowEntradaModal(false);
      resetForm();
      showToast(`+${formData.cantidad} unidades ingresadas`);
    } catch {
      showToast('Error registrando entrada de stock', 'error');
    }
    setProcessing(false);
  };

  // Ajuste de stock
  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !formData.motivo.trim()) return;
    setProcessing(true);
    try {
      await api.ajusteStock({
        productoId: selectedProduct.id,
        cantidad: formData.cantidad,
        tipo: formData.tipoAjuste,
        motivo: formData.motivo,
      });
      const diff = formData.tipoAjuste === 'INCREMENTO' ? formData.cantidad : -formData.cantidad;
      const updatedProduct = { ...selectedProduct, stock: Math.max(0, selectedProduct.stock + diff) };
      dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
      setSelectedProduct(updatedProduct);
      loadKardex(selectedProduct.id);
      setShowAjusteModal(false);
      resetForm();
      showToast(`Stock ajustado: ${diff > 0 ? '+' : ''}${diff} unidades`);
    } catch {
      showToast('Error registrando ajuste de stock', 'error');
    }
    setProcessing(false);
  };

  const resetForm = () => {
    setFormData({ cantidad: 1, motivo: '', proveedorId: '', precioCosto: 0, tipoAjuste: 'INCREMENTO' });
  };

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Gestión de Inventario</h1>
          <p className="page-subtitle">Control de existencias y trazabilidad de movimientos</p>
        </div>
        {stats.alertCount > 0 && (
          <div className="stock-alert">
            <AlertCircle size={18} />
            <span>{stats.alertCount} producto{stats.alertCount > 1 ? 's' : ''} con stock bajo o agotado</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="billing-stats">
        <div className="billing-stat-card">
          <span className="billing-stat-label">Stock Total (Unidades)</span>
          <span className="billing-stat-value text-accent">{stats.totalItems.toLocaleString()}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Valor en Inventario</span>
          <span className="billing-stat-value">{formatCurrency(stats.totalValue, currency)}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Productos</span>
          <span className="billing-stat-value">{products.length}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Agotados</span>
          <span className="billing-stat-value" style={{ color: stats.critical > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {stats.critical}
          </span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Stock Bajo</span>
          <span className="billing-stat-value" style={{ color: stats.low > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {stats.low}
          </span>
        </div>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="inv-layout">
        {/* Left: Product list */}
        <div className="inv-sidebar">
          <div className="inv-sidebar-search">
            <div className="toolbar-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar producto, código, modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="inv-sidebar-filters">
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} style={{ fontSize: '0.75rem', padding: '4px 6px' }}>
              {STOCK_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ fontSize: '0.75rem', padding: '4px 6px' }}>
              <option value="">Todas las categorías</option>
              {categories.filter(Boolean).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="inv-product-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const level = getStockLevel(p);
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`inv-product-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectProduct(p)}
                  >
                    <div className="inv-product-item-info">
                      <span className="inv-product-item-name">{p.name || p.nombre}</span>
                      <span className="inv-product-item-code">{p.barcode || p.codigo || 'S/C'}</span>
                    </div>
                    <div className="inv-product-item-stock">
                      <span className={`stock-badge ${level}`}>{p.stock || 0}</span>
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

        {/* Right: Detail panel */}
        <div className="inv-content">
          {selectedProduct ? (
            <>
              {/* Product info banner */}
              <div className="inv-product-banner">
                <div className="inv-product-banner-icon">
                  <Package size={28} />
                </div>
                <div className="inv-product-banner-info">
                  <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedProduct.name || selectedProduct.nombre}</h2>
                  <div className="inv-product-banner-meta">
                    <span>SKU: <strong>{selectedProduct.barcode || selectedProduct.codigo || 'N/A'}</strong></span>
                    <span>Categoría: <strong>{selectedProduct.category || selectedProduct.categoria || '-'}</strong></span>
                    {selectedProduct.modelo && <span>Modelo: <strong>{selectedProduct.modelo}</strong></span>}
                    <span>Stock Mín: <strong>{selectedProduct.stockMinimo || 5}</strong></span>
                  </div>
                </div>
                <div className="inv-product-banner-stock">
                  <span className="inv-stock-number">{selectedProduct.stock || 0}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>UNIDADES</span>
                </div>
                <div className="inv-product-banner-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => setShowEntradaModal(true)}>
                    <Plus size={14} /> Entrada
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAjusteModal(true)}>
                    <Settings2 size={14} /> Ajustar
                  </button>
                </div>
              </div>

              {/* Kardex table */}
              <div className="table-container" style={{ marginTop: '1rem' }}>
                <div className="inv-kardex-header">
                  <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} style={{ color: 'var(--color-accent)' }} />
                    Kardex — Movimientos
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => loadKardex(selectedProduct.id)} disabled={loadingKardex}>
                    <RefreshCw size={14} className={loadingKardex ? 'spinning' : ''} /> Actualizar
                  </button>
                </div>

                {loadingKardex ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <RefreshCw size={24} className="spinning" />
                    <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>Cargando movimientos...</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Concepto / Referencia</th>
                        <th style={{ textAlign: 'right' }}>Cantidad</th>
                        <th style={{ textAlign: 'right' }}>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kardex.length > 0 ? (
                        kardex.map((mov, idx) => (
                          <tr key={idx}>
                            <td className="text-muted">{formatDate(mov.fechaEmision || mov.fecha || mov.createdAt)}</td>
                            <td>
                              <span className={`mov-badge mov-${(mov.tipo || 'AJUSTE').toLowerCase()}`}>
                                {mov.tipo === 'ENTRADA' ? <ArrowDownLeft size={10} /> :
                                 mov.tipo === 'SALIDA' ? <ArrowUpRight size={10} /> :
                                 <ArrowRightLeft size={10} />}
                                {mov.tipo}
                              </span>
                            </td>
                            <td>
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{mov.concepto || mov.motivo || '-'}</span>
                                {mov.documentoReferencia && (
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{mov.documentoReferencia}</span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              <span style={{ color: mov.tipo === 'ENTRADA' ? 'var(--color-success)' : mov.tipo === 'SALIDA' ? 'var(--color-danger)' : 'var(--color-info)' }}>
                                {mov.tipo === 'SALIDA' ? '-' : '+'}{mov.cantidad}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }} className="text-accent">{mov.saldoPosterior ?? '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            No hay movimientos registrados para este producto
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="inv-empty-detail">
              <Package size={56} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
              <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1.1rem' }}>Seleccione un producto</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>
                Elija un producto de la lista para ver su kardex, saldo actual y realizar entradas o ajustes de stock.
              </p>
            </div>
          )}

          {/* Low stock alerts section */}
          {lowStockProducts.length > 0 && !selectedProduct && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                Productos con stock bajo o agotado ({lowStockProducts.length})
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'right' }}>Stock Actual</th>
                      <th style={{ textAlign: 'right' }}>Stock Mínimo</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => {
                      const level = getStockLevel(p);
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 500 }}>{p.name || p.nombre}</td>
                          <td className="text-muted">{p.barcode || p.codigo || '-'}</td>
                          <td><span className="category-tag">{p.category || p.categoria || '-'}</span></td>
                          <td style={{ textAlign: 'right' }}><span className={`stock-badge ${level}`}>{p.stock || 0}</span></td>
                          <td style={{ textAlign: 'right' }} className="text-muted">{p.stockMinimo || 5}</td>
                          <td>
                            {(p.stock || 0) === 0
                              ? <span className="stock-badge critical">AGOTADO</span>
                              : <span className="stock-badge low">BAJO</span>
                            }
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                handleSelectProduct(p);
                                setShowEntradaModal(true);
                              }}
                            >
                              <Plus size={12} /> Reabastecer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Entrada de Stock */}
      <Modal
        isOpen={showEntradaModal}
        onClose={() => { setShowEntradaModal(false); resetForm(); }}
        title={`Entrada de Stock: ${selectedProduct?.name || selectedProduct?.nombre || ''}`}
      >
        {selectedProduct && (
          <form onSubmit={handleStockEntry}>
            <div className="nc-ref-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stock Actual:</span>
                <strong style={{ fontSize: '1.25rem' }}>{selectedProduct.stock || 0}</strong>
              </div>
              {formData.cantidad > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #2D2D44' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Nuevo Stock:</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>{(selectedProduct.stock || 0) + formData.cantidad}</strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Cantidad a ingresar *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label>Precio de Costo (unitario)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precioCosto}
                onChange={(e) => setFormData({ ...formData, precioCosto: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowEntradaModal(false); resetForm(); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={processing || formData.cantidad <= 0}>
                {processing ? 'Registrando...' : 'Registrar Entrada'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Ajuste de Stock */}
      <Modal
        isOpen={showAjusteModal}
        onClose={() => { setShowAjusteModal(false); resetForm(); }}
        title={`Ajuste de Stock: ${selectedProduct?.name || selectedProduct?.nombre || ''}`}
      >
        {selectedProduct && (
          <form onSubmit={handleStockAdjustment}>
            <div className="nc-ref-card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Stock Actual:</span>
                <strong style={{ fontSize: '1.25rem' }}>{selectedProduct.stock || 0}</strong>
              </div>
              {formData.cantidad > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #2D2D44' }}>
                  <span style={{ fontSize: '0.8rem', color: formData.tipoAjuste === 'INCREMENTO' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    Nuevo Stock:
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: formData.tipoAjuste === 'INCREMENTO' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {Math.max(0, (selectedProduct.stock || 0) + (formData.tipoAjuste === 'INCREMENTO' ? formData.cantidad : -formData.cantidad))}
                  </strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Tipo de Ajuste</label>
              <div className="inv-ajuste-toggle">
                <button
                  type="button"
                  className={`inv-ajuste-btn ${formData.tipoAjuste === 'INCREMENTO' ? 'active incremento' : ''}`}
                  onClick={() => setFormData({ ...formData, tipoAjuste: 'INCREMENTO' })}
                >
                  <Plus size={16} /> Incremento
                </button>
                <button
                  type="button"
                  className={`inv-ajuste-btn ${formData.tipoAjuste === 'DECREMENTO' ? 'active decremento' : ''}`}
                  onClick={() => setFormData({ ...formData, tipoAjuste: 'DECREMENTO' })}
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
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label>Motivo del Ajuste *</label>
              <textarea
                required
                rows={3}
                placeholder="Ej: Inventario real difiere de sistema, producto dañado, devolución..."
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {formData.tipoAjuste === 'DECREMENTO' && formData.cantidad > (selectedProduct.stock || 0) && (
              <div className="nc-warning">
                <AlertTriangle size={16} />
                <span>La cantidad supera el stock actual. El stock quedará en 0.</span>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowAjusteModal(false); resetForm(); }}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn ${formData.tipoAjuste === 'DECREMENTO' ? 'btn-danger' : 'btn-primary'}`}
                disabled={processing || formData.cantidad <= 0 || !formData.motivo.trim()}
              >
                {processing ? 'Procesando...' : 'Aplicar Ajuste'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
