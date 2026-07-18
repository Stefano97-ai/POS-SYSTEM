import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Plus, Search, Edit, Trash2, Building2, User, Mail, Phone } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import CustomerFormModal from '../components/customers/CustomerFormModal';

export default function Customers() {
  const { state, dispatch } = useApp();
  const { customers, settings } = state;
  const currency = settings.currency || 'S/.';

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase();
    const matchSearch = c.name?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term) ||
      c.numeroDocumento?.includes(search) || c.razonSocial?.toLowerCase().includes(term);
    return matchSearch && (filterTipo === 'Todos' || c.tipoCliente === filterTipo);
  });

  const handleOpenModal = (customer = null) => {
    setEditCustomer(customer);
    setShowModal(true);
  };

  const handleSave = async (form) => {
    const payload = {
      tipoDocumento: form.tipoDocumento, numeroDocumento: form.numeroDocumento || null,
      tipoCliente: form.tipoCliente, nombre: form.name, razonSocial: form.razonSocial || null,
      direccion: form.address || null, telefono: form.phone || null, email: form.email || null,
      clasificacion: form.clasificacion, notas: form.notes || null,
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
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      await api.deleteCustomer(id);
      dispatch({ type: 'DELETE_CUSTOMER', payload: id });
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="data-page-premium">
      <div className="page-header-premium">
        <div className="title-area">
          <h1>Clientes</h1>
          <p>{customers.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="data-card-premium">
        <div className="toolbar-premium">
          <div className="search-bar">
            <Search size={18} color="var(--color-text-muted)" />
            <input type="text" placeholder="Buscar por nombre, RUC, DNI..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filters">
            <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
              <option value="Todos">Todos los tipos</option>
              <option value="PERSONA">Persona</option>
              <option value="EMPRESA">Empresa</option>
            </select>
          </div>
        </div>

        <div className="table-container-premium">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Clasificación</th>
                <th>Contacto</th>
                <th>Total Compras</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const isEmpresa = customer.tipoCliente === 'EMPRESA';
                const isGeneral = customer.name === 'Cliente General' || customer.nombre === 'Cliente General';
                const clsColor = customer.clasificacion === 'NUEVO' ? 'neutral' : customer.clasificacion === 'FRECUENTE' ? 'success' : 'warning';
                
                return (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: isEmpresa ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: isEmpresa ? '#D97706' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isEmpresa ? <Building2 size={18} /> : <User size={18} />}
                        </div>
                        <div>
                          <span className="cell-primary">{customer.name || customer.nombre}</span>
                          {customer.razonSocial && customer.razonSocial !== customer.name && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{customer.razonSocial}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {customer.tipoDocumento && customer.tipoDocumento !== 'SIN_DOC' ? (
                        <span className="badge-premium neutral">
                          {customer.tipoDocumento}: {customer.numeroDocumento}
                        </span>
                      ) : <span className="cell-muted">—</span>}
                    </td>
                    <td>
                      {customer.clasificacion ? (
                        <span className={`badge-premium ${clsColor}`}>
                          {customer.clasificacion}
                        </span>
                      ) : <span className="cell-muted">—</span>}
                    </td>
                    <td className="cell-muted">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {customer.email && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {customer.email}</div>}
                        {(customer.phone || customer.telefono) && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {customer.phone || customer.telefono}</div>}
                        {!customer.email && !(customer.phone || customer.telefono) && '—'}
                      </div>
                    </td>
                    <td className="cell-currency">
                      {formatCurrency(customer.totalPurchases || customer.totalCompras || 0, currency)}
                    </td>
                    <td>
                      <div className="action-cell">
                        <button className="btn-action-premium edit" onClick={() => handleOpenModal(customer)} title="Editar">
                          <Edit size={16} />
                        </button>
                        {!isGeneral && (
                          <button className="btn-action-premium delete" onClick={() => handleDelete(customer.id)} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        editCustomer={editCustomer}
      />
    </div>
  );
}
