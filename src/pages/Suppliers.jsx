import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Truck,
  Phone,
  Mail,
  MapPin,
  Globe,
  Package,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function Suppliers() {
  const { state, dispatch } = useApp();
  const { suppliers, products, settings } = state;
  const currency = settings.currency || 'S/.';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    razonSocial: '',
    correo: '',
    telefono: '',
    direccion: '',
    sitioWeb: '',
    contactoNombre: '',
    contactoCargo: '',
    notas: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (suppliers || []).filter((s) => {
      const nombre = (s.nombre || '').toLowerCase();
      const ruc = (s.ruc || '').toLowerCase();
      const razon = (s.razonSocial || '').toLowerCase();
      return nombre.includes(q) || ruc.includes(q) || razon.includes(q);
    });
  }, [suppliers, search]);

  // Stats
  const stats = useMemo(() => {
    const total = (suppliers || []).length;
    const conRuc = (suppliers || []).filter((s) => s.ruc).length;
    return { total, conRuc };
  }, [suppliers]);

  // Products associated to a supplier
  const getSupplierProducts = (supplierId) => {
    return products.filter((p) => p.proveedorId === supplierId);
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        nombre: supplier.nombre || '',
        ruc: supplier.ruc || '',
        razonSocial: supplier.razonSocial || '',
        correo: supplier.correo || supplier.email || '',
        telefono: supplier.telefono || '',
        direccion: supplier.direccion || '',
        sitioWeb: supplier.sitioWeb || '',
        contactoNombre: supplier.contactoNombre || '',
        contactoCargo: supplier.contactoCargo || '',
        notas: supplier.notas || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        nombre: '', ruc: '', razonSocial: '', correo: '', telefono: '',
        direccion: '', sitioWeb: '', contactoNombre: '', contactoCargo: '', notas: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (editingSupplier) {
        const updated = await api.updateProveedor(editingSupplier.id, formData);
        dispatch({ type: 'UPDATE_SUPPLIER', payload: updated });
        showToast('Proveedor actualizado');
      } else {
        const created = await api.createProveedor(formData);
        dispatch({ type: 'ADD_SUPPLIER', payload: created });
        showToast('Proveedor registrado');
      }
      setShowModal(false);
    } catch {
      showToast('Error al guardar el proveedor', 'error');
    }
    setProcessing(false);
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`¿Eliminar al proveedor "${supplier.nombre}"?`)) return;
    try {
      await api.deleteProveedor(supplier.id);
      dispatch({ type: 'DELETE_SUPPLIER', payload: supplier.id });
      if (showDetail?.id === supplier.id) setShowDetail(null);
      showToast('Proveedor eliminado');
    } catch {
      showToast('No se pudo eliminar. Puede tener productos asociados.', 'error');
    }
  };

  return (
    <div className="suppliers-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">{stats.total} proveedores registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Nuevo Proveedor
        </button>
      </div>

      {/* Stats */}
      <div className="billing-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Total Proveedores</span>
          <span className="billing-stat-value text-accent">{stats.total}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Con RUC</span>
          <span className="billing-stat-value">{stats.conRuc}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Sin RUC</span>
          <span className="billing-stat-value">{stats.total - stats.conRuc}</span>
        </div>
      </div>

      {/* Search */}
      <div className="products-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC o razón social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Supplier cards grid */}
      {filtered.length > 0 ? (
        <div className="suppliers-grid">
          {filtered.map((s) => {
            const supplierProducts = getSupplierProducts(s.id);
            return (
              <div key={s.id} className="supplier-card" onClick={() => setShowDetail(s)}>
                <div className="supplier-card-header">
                  <div className="supplier-avatar">
                    <Truck size={20} />
                  </div>
                  <div className="supplier-card-info">
                    <h3>{s.nombre}</h3>
                    {s.ruc && <span className="supplier-ruc">RUC: {s.ruc}</span>}
                    {s.razonSocial && s.razonSocial !== s.nombre && (
                      <span className="supplier-razon">{s.razonSocial}</span>
                    )}
                  </div>
                  <div className="supplier-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(s); }}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
                      title="Eliminar"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="supplier-card-details">
                  {s.telefono && (
                    <div className="supplier-detail-row">
                      <Phone size={13} /> <span>{s.telefono}</span>
                    </div>
                  )}
                  {(s.correo || s.email) && (
                    <div className="supplier-detail-row">
                      <Mail size={13} /> <span>{s.correo || s.email}</span>
                    </div>
                  )}
                  {s.direccion && (
                    <div className="supplier-detail-row">
                      <MapPin size={13} /> <span>{s.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="supplier-card-footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <Package size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {supplierProducts.length} producto{supplierProducts.length !== 1 ? 's' : ''} asociado{supplierProducts.length !== 1 ? 's' : ''}
                  </span>
                  {s.sitioWeb && (
                    <a
                      href={s.sitioWeb.startsWith('http') ? s.sitioWeb : `https://${s.sitioWeb}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="supplier-web-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Globe size={12} /> Web
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <Truck size={48} />
          <p>No se encontraron proveedores</p>
          <span>{(suppliers || []).length === 0 ? 'Registra tu primer proveedor para empezar' : 'Intenta con otro término de búsqueda'}</span>
        </div>
      )}

      {/* Modal: Crear/Editar Proveedor */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre / Empresa *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Inversiones Globales S.A.C."
              />
            </div>
            <div className="form-group">
              <label>RUC</label>
              <input
                type="text"
                value={formData.ruc}
                onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                placeholder="20123456789"
                maxLength={11}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Razón Social</label>
            <input
              type="text"
              value={formData.razonSocial}
              onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
              placeholder="Razón social completa (si es diferente al nombre)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="987 654 321"
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="contacto@proveedor.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Av. Las Magnolias 123, Lima"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Persona de Contacto</label>
              <input
                type="text"
                value={formData.contactoNombre}
                onChange={(e) => setFormData({ ...formData, contactoNombre: e.target.value })}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="form-group">
              <label>Cargo</label>
              <input
                type="text"
                value={formData.contactoCargo}
                onChange={(e) => setFormData({ ...formData, contactoCargo: e.target.value })}
                placeholder="Ej: Gerente de Ventas"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Sitio Web</label>
            <input
              type="text"
              value={formData.sitioWeb}
              onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
              placeholder="www.proveedor.com"
            />
          </div>

          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Observaciones, condiciones de pago, días de entrega..."
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={processing || !formData.nombre.trim()}>
              {processing ? 'Guardando...' : editingSupplier ? 'Actualizar' : 'Registrar Proveedor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detalle del proveedor */}
      <Modal
        isOpen={!!showDetail}
        onClose={() => setShowDetail(null)}
        title="Detalle del Proveedor"
        size="lg"
      >
        {showDetail && (
          <div>
            <div className="supplier-detail-banner">
              <div className="supplier-avatar" style={{ width: '48px', height: '48px' }}>
                <Truck size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{showDetail.nombre}</h3>
                {showDetail.ruc && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>RUC: {showDetail.ruc}</span>}
                {showDetail.razonSocial && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-sec)' }}>{showDetail.razonSocial}</span>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowDetail(null); handleOpenModal(showDetail); }}>
                <Edit2 size={14} /> Editar
              </button>
            </div>

            <div className="supplier-detail-section">
              <h4>Información de contacto</h4>
              <div className="expanded-info-list">
                {showDetail.telefono && (
                  <div className="expanded-info-row"><span>Teléfono:</span><span>{showDetail.telefono}</span></div>
                )}
                {(showDetail.correo || showDetail.email) && (
                  <div className="expanded-info-row"><span>Email:</span><span>{showDetail.correo || showDetail.email}</span></div>
                )}
                {showDetail.direccion && (
                  <div className="expanded-info-row"><span>Dirección:</span><span>{showDetail.direccion}</span></div>
                )}
                {showDetail.sitioWeb && (
                  <div className="expanded-info-row"><span>Web:</span><span>{showDetail.sitioWeb}</span></div>
                )}
                {showDetail.contactoNombre && (
                  <div className="expanded-info-row"><span>Contacto:</span><span>{showDetail.contactoNombre}{showDetail.contactoCargo ? ` (${showDetail.contactoCargo})` : ''}</span></div>
                )}
              </div>
            </div>

            {showDetail.notas && (
              <div className="supplier-detail-section">
                <h4>Notas</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sec)', margin: 0 }}>{showDetail.notas}</p>
              </div>
            )}

            <div className="supplier-detail-section">
              <h4>Productos asociados ({getSupplierProducts(showDetail.id).length})</h4>
              {getSupplierProducts(showDetail.id).length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th>Stock</th>
                        <th>P. Venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSupplierProducts(showDetail.id).map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 500 }}>{p.name || p.nombre}</td>
                          <td className="text-muted">{p.barcode || p.codigo || '-'}</td>
                          <td>
                            <span className={`stock-badge ${getStockLevel(p)}`}>{p.stock || 0}</span>
                          </td>
                          <td className="text-accent">{formatCurrency(p.price || p.precioVenta, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.5rem 0' }}>
                  No hay productos asociados a este proveedor
                </p>
              )}
            </div>
          </div>
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

function getStockLevel(product) {
  const stock = product.stock || 0;
  const min = product.stockMinimo || 5;
  if (stock === 0) return 'critical';
  if (stock <= min) return 'low';
  if (stock <= min * 2) return 'medium';
  return 'good';
}
