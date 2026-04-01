import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Search, Edit, Trash2, Mail, Phone, Building2, User, FileText } from 'lucide-react';

const TIPO_DOC_OPTIONS = [
  { value: 'DNI', label: 'DNI' },
  { value: 'RUC', label: 'RUC' },
  { value: 'CE', label: 'Carné de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'SIN_DOC', label: 'Sin Documento' },
];

const CLASIFICACION_OPTIONS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'FRECUENTE', label: 'Frecuente' },
  { value: 'CORPORATIVO', label: 'Corporativo' },
];

export default function Customers() {
  const { state, dispatch } = useApp();
  const { customers, settings } = state;

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', notes: '',
    tipoDocumento: 'DNI', numeroDocumento: '', tipoCliente: 'PERSONA',
    razonSocial: '', clasificacion: 'NUEVO',
  });

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase();
    const matchSearch = c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.numeroDocumento?.includes(search) ||
      c.razonSocial?.toLowerCase().includes(term);
    const matchTipo = filterTipo === 'Todos' || c.tipoCliente === filterTipo;
    return matchSearch && matchTipo;
  });

  const openAdd = () => {
    setEditCustomer(null);
    setForm({
      name: '', email: '', phone: '', address: '', notes: '',
      tipoDocumento: 'DNI', numeroDocumento: '', tipoCliente: 'PERSONA',
      razonSocial: '', clasificacion: 'NUEVO',
    });
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditCustomer(customer);
    setForm({
      name: customer.name || customer.nombre || '',
      email: customer.email || '',
      phone: customer.phone || customer.telefono || '',
      address: customer.address || customer.direccion || '',
      notes: customer.notes || customer.notas || '',
      tipoDocumento: customer.tipoDocumento || 'DNI',
      numeroDocumento: customer.numeroDocumento || '',
      tipoCliente: customer.tipoCliente || 'PERSONA',
      razonSocial: customer.razonSocial || '',
      clasificacion: customer.clasificacion || 'NUEVO',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    if (form.tipoCliente === 'EMPRESA' && !form.razonSocial) {
      alert('La razón social es obligatoria para empresas');
      return;
    }
    if (form.tipoDocumento === 'RUC' && (!form.numeroDocumento || form.numeroDocumento.length !== 11)) {
      alert('El RUC debe tener 11 dígitos');
      return;
    }
    if (form.tipoDocumento === 'DNI' && form.numeroDocumento && form.numeroDocumento.length !== 8) {
      alert('El DNI debe tener 8 dígitos');
      return;
    }

    const payload = {
      tipoDocumento: form.tipoDocumento,
      numeroDocumento: form.numeroDocumento || null,
      tipoCliente: form.tipoCliente,
      nombre: form.name,
      razonSocial: form.razonSocial || null,
      direccion: form.address || null,
      telefono: form.phone || null,
      email: form.email || null,
      clasificacion: form.clasificacion,
      notas: form.notes || null,
    };

    try {
      if (editCustomer) {
        const saved = await api.updateCustomer(editCustomer.id, payload);
        dispatch({ type: 'UPDATE_CUSTOMER', payload: saved });
      } else {
        const saved = await api.createCustomer(payload);
        dispatch({ type: 'ADD_CUSTOMER', payload: saved });
      }
      setShowModal(false);
    } catch (e) {
      alert("Error: " + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await api.deleteCustomer(id);
        dispatch({ type: 'DELETE_CUSTOMER', payload: id });
      } catch (e) {
        alert("Error: " + (e.response?.data?.message || e.message));
      }
    }
  };

  const handleTipoClienteChange = (tipo) => {
    setForm({
      ...form,
      tipoCliente: tipo,
      tipoDocumento: tipo === 'EMPRESA' ? 'RUC' : 'DNI',
      clasificacion: tipo === 'EMPRESA' ? 'CORPORATIVO' : form.clasificacion,
    });
  };

  const getClasificacionBadge = (clasificacion) => {
    const colors = {
      'NUEVO': 'info',
      'FRECUENTE': 'success',
      'CORPORATIVO': 'warning',
    };
    return colors[clasificacion] || 'info';
  };

  return (
    <div className="customers-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{customers.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="products-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC, DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
          <option value="Todos">Todos los tipos</option>
          <option value="PERSONA">Persona</option>
          <option value="EMPRESA">Empresa</option>
        </select>
      </div>

      <div className="customers-grid">
        {filtered.map((customer) => (
          <div key={customer.id} className="customer-card">
            <div className="customer-card-header">
              <div className="customer-avatar" style={{ background: customer.tipoCliente === 'EMPRESA' ? 'var(--warning)' : 'var(--primary)' }}>
                {customer.tipoCliente === 'EMPRESA' ? <Building2 size={18} /> : customer.name?.charAt(0).toUpperCase()}
              </div>
              <div className="customer-info">
                <h3>{customer.name || customer.nombre}</h3>
                {customer.razonSocial && customer.razonSocial !== customer.name && (
                  <span className="customer-notes">{customer.razonSocial}</span>
                )}
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {customer.tipoDocumento && customer.tipoDocumento !== 'SIN_DOC' && (
                    <span className="category-tag" style={{ fontSize: '0.7rem' }}>
                      {customer.tipoDocumento}: {customer.numeroDocumento}
                    </span>
                  )}
                  {customer.clasificacion && (
                    <span className={`stock-badge ${getClasificacionBadge(customer.clasificacion)}`} style={{ fontSize: '0.7rem' }}>
                      {customer.clasificacion}
                    </span>
                  )}
                </div>
              </div>
              <div className="customer-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(customer)}>
                  <Edit size={14} />
                </button>
                {(customer.name !== 'Cliente General' && customer.nombre !== 'Cliente General') && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(customer.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="customer-details">
              {customer.email && (
                <div className="customer-detail">
                  <Mail size={14} />
                  <span>{customer.email}</span>
                </div>
              )}
              {(customer.phone || customer.telefono) && (
                <div className="customer-detail">
                  <Phone size={14} />
                  <span>{customer.phone || customer.telefono}</span>
                </div>
              )}
            </div>
            <div className="customer-footer">
              <span className="customer-purchases">
                Total compras: <strong>{formatCurrency(customer.totalPurchases || customer.totalCompras || 0, settings.currency)}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCustomer ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
        {/* Tipo de cliente */}
        <div className="form-group">
          <label>Tipo de Cliente</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${form.tipoCliente === 'PERSONA' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTipoClienteChange('PERSONA')}
              style={{ flex: 1 }}
            >
              <User size={16} /> Persona
            </button>
            <button
              type="button"
              className={`btn ${form.tipoCliente === 'EMPRESA' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleTipoClienteChange('EMPRESA')}
              style={{ flex: 1 }}
            >
              <Building2 size={16} /> Empresa
            </button>
          </div>
        </div>

        {/* Documento */}
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Documento</label>
            <select value={form.tipoDocumento} onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}>
              {TIPO_DOC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Número de Documento</label>
            <input
              value={form.numeroDocumento}
              onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value.replace(/\D/g, '') })}
              placeholder={form.tipoDocumento === 'RUC' ? '20XXXXXXXXX' : 'XXXXXXXX'}
              maxLength={form.tipoDocumento === 'RUC' ? 11 : form.tipoDocumento === 'DNI' ? 8 : 20}
            />
          </div>
        </div>

        {/* Nombre */}
        <div className="form-group">
          <label>{form.tipoCliente === 'EMPRESA' ? 'Nombre Comercial' : 'Nombre Completo'}</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.tipoCliente === 'EMPRESA' ? 'Nombre comercial' : 'Nombre completo'} />
        </div>

        {/* Razón Social (solo empresas) */}
        {form.tipoCliente === 'EMPRESA' && (
          <div className="form-group">
            <label>Razón Social *</label>
            <input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} placeholder="Razón social según SUNAT" />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@email.com" />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="999 999 999" />
          </div>
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección fiscal completa" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Clasificación</label>
            <select value={form.clasificacion} onChange={(e) => setForm({ ...form, clasificacion: e.target.value })}>
              {CLASIFICACION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Notas</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales..." />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {editCustomer ? 'Guardar Cambios' : 'Agregar Cliente'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
