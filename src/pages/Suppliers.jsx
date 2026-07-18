import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Search, Plus, Truck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import SupplierCard from '../components/suppliers/SupplierCard';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';
import SupplierDetailModal from '../components/suppliers/SupplierDetailModal';

export default function Suppliers() {
  const { state, dispatch } = useApp();
  const { suppliers, products, settings } = state;
  const currency = settings.currency || 'S/.';

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast, showToast } = useToast();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (suppliers || []).filter((s) =>
      (s.nombre || '').toLowerCase().includes(q) ||
      (s.ruc || '').toLowerCase().includes(q) ||
      (s.razonSocial || '').toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const stats = useMemo(() => {
    const total = (suppliers || []).length;
    const conRuc = (suppliers || []).filter((s) => s.ruc).length;
    return { total, conRuc };
  }, [suppliers]);

  const getSupplierProducts = (supplierId) => products.filter((p) => p.proveedorId === supplierId);

  const handleOpenModal = (supplier = null) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleSubmit = async (formData) => {
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
    <div className="data-page-premium">
      <div className="page-header-premium">
        <div className="title-area">
          <h1>Proveedores</h1>
          <p>{stats.total} proveedores registrados</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      <div className="billing-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Total Proveedores', value: stats.total, accent: true },
          { label: 'Con RUC', value: stats.conRuc },
          { label: 'Sin RUC', value: stats.total - stats.conRuc },
        ].map(({ label, value, accent }) => (
          <div key={label} className="billing-stat-card">
            <span className="billing-stat-label">{label}</span>
            <span className={`billing-stat-value ${accent ? 'text-accent' : ''}`}>{value}</span>
          </div>
        ))}
      </div>

      <div className="toolbar-premium" style={{ borderRadius: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="search-bar">
          <Search size={18} color="var(--color-text-muted)" />
          <input type="text" placeholder="Buscar por nombre, RUC o razón social..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="suppliers-grid">
          {filtered.map((s) => (
            <SupplierCard
              key={s.id}
              supplier={s}
              productCount={getSupplierProducts(s.id).length}
              onClick={() => setShowDetail(s)}
              onEdit={() => handleOpenModal(s)}
              onDelete={() => handleDelete(s)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <Truck size={48} />
          <p>No se encontraron proveedores</p>
          <span>{(suppliers || []).length === 0 ? 'Registra tu primer proveedor para empezar' : 'Intenta con otro término de búsqueda'}</span>
        </div>
      )}

      <SupplierFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        processing={processing}
        editingSupplier={editingSupplier}
      />

      <SupplierDetailModal
        supplier={showDetail}
        supplierProducts={showDetail ? getSupplierProducts(showDetail.id) : []}
        currency={currency}
        onClose={() => setShowDetail(null)}
        onEdit={() => { setShowDetail(null); handleOpenModal(showDetail); }}
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
