// CAMBIO N°4: Botón "Cliente General" de acceso rápido
// CAMBIO N°5: Autocompletado mejorado con últimos clientes recientes y "Crear nuevo"
// CAMBIO N°6: Tooltip en "Nota de Venta" (se aplica en POS.jsx)
import { useState, useRef } from 'react';
import { User, UserPlus, Building2, X, Clock } from 'lucide-react';
import Modal from '../Modal';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';

export default function CustomerSearch({ onSetTipoComprobante, onQuickRegister, searchRef }) {
  const { state, dispatch } = useApp();
  const { customers, selectedCustomer } = state;
  const { toast, showToast } = useToast();

  const [customerSearch, setCustomerSearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickForm, setQuickForm] = useState({
    name: '', tipoDocumento: 'DNI', numeroDocumento: '', tipoCliente: 'PERSONA',
    razonSocial: '', phone: '', email: '', address: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  // CAMBIO N°5: Últimos 5 clientes (para mostrar cuando el campo está vacío y enfocado)
  const recentCustomers = [...customers]
    .filter(c => (c.name || c.nombre) !== 'Cliente General')
    .slice(0, 5);

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch) return false; // sin texto: no filtrar, se muestran los recientes
    const term = customerSearch.toLowerCase();
    return (c.name || c.nombre || '').toLowerCase().includes(term) ||
      (c.numeroDocumento || '').includes(customerSearch) ||
      (c.razonSocial || '').toLowerCase().includes(term);
  });

  // Cerrar modal limpia la búsqueda
  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setCustomerSearch('');
  };

  const handleSelect = (customer) => {
    dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: customer });
    onSetTipoComprobante(
      customer?.tipoDocumento === 'RUC' || customer?.tipoCliente === 'EMPRESA' ? 'FACTURA' : 'BOLETA'
    );
    setCustomerSearch('');
    setShowSearchModal(false);
  };

  // CAMBIO N°4: Asignar Cliente General con un clic
  const handleClienteGeneral = () => {
    dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: null });
    onSetTipoComprobante('BOLETA');
    setCustomerSearch('');
    setShowSearchModal(false);
  };

  const handleQuickRegister = async () => {
    if (!quickForm.name) return;
    if (quickForm.tipoDocumento === 'RUC' && quickForm.numeroDocumento.length !== 11) {
      showToast('El RUC debe tener 11 dígitos', 'error');
      return;
    }
    if (quickForm.tipoDocumento === 'DNI' && quickForm.numeroDocumento && quickForm.numeroDocumento.length !== 8) {
      showToast('El DNI debe tener 8 dígitos', 'error');
      return;
    }
    setRegisterLoading(true);
    try {
      const saved = await onQuickRegister(quickForm);
      handleSelect(saved);
      setShowQuickRegister(false);
      setQuickForm({ name: '', tipoDocumento: 'DNI', numeroDocumento: '', tipoCliente: 'PERSONA', razonSocial: '', phone: '', email: '', address: '' });
    } catch (e) {
      showToast('Error registrando cliente: ' + (e.response?.data?.message || e.message), 'error');
    } finally {
      setRegisterLoading(false);
    }
  };

  // CAMBIO N°5: Lista a mostrar en el modal
  const displayList = customerSearch.length >= 2 ? filteredCustomers : recentCustomers;
  const isSearching = customerSearch.length >= 2;

  return (
    <div className="customer-search-premium">
      {/* Botones de acción rápida */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn-icon-premium"
          style={{ flex: 1, padding: '0 0.75rem', width: 'auto', justifyContent: 'flex-start', gap: '0.5rem', background: !selectedCustomer ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-bg-dark)', color: !selectedCustomer ? 'var(--color-primary-dark)' : 'var(--color-text-sec)', fontWeight: !selectedCustomer ? 600 : 500 }}
          onClick={handleClienteGeneral}
          title="Asignar Cliente General (sin documento)"
        >
          <User size={14} /> Cliente General
        </button>
        <button
          className="btn-icon-premium"
          onClick={() => setShowQuickRegister(true)}
          title="Registrar nuevo cliente"
        >
          <UserPlus size={16} />
        </button>
      </div>

      {/* Buscador Botón que abre el modal */}
      <button 
        className="customer-input-wrapper" 
        onClick={() => { setShowSearchModal(true); setTimeout(() => searchRef.current?.focus(), 100); }}
        style={{ width: '100%', cursor: 'pointer', textAlign: 'left', background: 'var(--color-bg-dark)', border: '1px solid var(--color-border)' }}
      >
        <User size={16} color="var(--color-text-muted)" />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Buscar por RUC, DNI o nombre...</span>
      </button>

      {/* MODAL DE BÚSQUEDA TIPO COMMAND PALETTE */}
      <Modal isOpen={showSearchModal} onClose={handleCloseSearchModal} hideHeader={true} noPadding={true}>
        {/* Barra de búsqueda gigante superior */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
          <User size={24} color="var(--color-primary)" style={{ flexShrink: 0, marginRight: '1rem' }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Escriba RUC, DNI o nombre..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            style={{ 
              flex: 1, border: 'none', background: 'transparent', outline: 'none', 
              fontSize: '1.25rem', color: 'var(--color-text-main)', padding: 0 
            }}
          />
          {customerSearch ? (
            <button style={{ background: 'var(--color-bg-dark)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '50%', color: 'var(--color-text-muted)' }} onClick={() => setCustomerSearch('')}>
              <X size={16} />
            </button>
          ) : (
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px', color: 'var(--color-text-muted)' }} onClick={handleCloseSearchModal}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'var(--color-bg-dark)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>ESC</span>
            </button>
          )}
        </div>

        {/* Lista de resultados */}
        <div style={{ maxHeight: '450px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--color-bg-dark)' }}>
          {!isSearching && recentCustomers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.75rem 0.25rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Clock size={12} /> Últimos clientes
            </div>
          )}

          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', borderRadius: '0.5rem', fontSize: '0.9rem', padding: '0.75rem 1rem', background: 'var(--color-bg-card)', border: '1px solid transparent', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
            onClick={() => handleSelect(null)}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <User size={18} style={{ marginRight: '12px', color: 'var(--color-primary)' }} /> 
            <span style={{ fontWeight: 600 }}>Cliente General</span>
            <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: '0.8rem' }}>(sin documento)</span>
          </button>

          {displayList.map((c) => (
            <button
              key={c.id}
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'flex-start', borderRadius: '0.5rem', fontSize: '0.9rem', padding: '0.75rem 1rem', background: 'var(--color-bg-card)', border: '1px solid transparent', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', transition: 'all 0.15s' }}
              onClick={() => handleSelect(c)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{c.name || c.nombre}</span>
                {c.numeroDocumento && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {c.tipoDocumento}: <span style={{ fontFamily: 'monospace' }}>{c.numeroDocumento}</span>
                  </span>
                )}
              </div>
            </button>
          ))}

          {isSearching && filteredCustomers.length === 0 && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--color-bg-card)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: 'var(--shadow-sm)' }}>
                <UserPlus size={28} color="var(--color-primary)" />
              </div>
              <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>No encontramos a <strong>"{customerSearch}"</strong></p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  setQuickForm(f => ({ ...f, name: customerSearch }));
                  setShowSearchModal(false);
                  setShowQuickRegister(true);
                }}
                style={{ borderRadius: '2rem', padding: '0.75rem 2rem' }}
              >
                Crear nuevo cliente
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Cliente seleccionado activo */}
      {selectedCustomer && !customerSearch && (
        <div className="active-customer-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <User size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong>{selectedCustomer.name || selectedCustomer.nombre}</strong>
              {selectedCustomer.numeroDocumento && (
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}> ({selectedCustomer.numeroDocumento})</span>
              )}
            </span>
          </div>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '0 4px', color: 'var(--color-primary-dark)' }} onClick={() => handleSelect(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modal de registro rápido */}
      <Modal isOpen={showQuickRegister} onClose={() => setShowQuickRegister(false)} title="Registro Rápido de Cliente">
        <div className="form-group">
          <label>Tipo de Cliente</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${quickForm.tipoCliente === 'PERSONA' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setQuickForm({ ...quickForm, tipoCliente: 'PERSONA', tipoDocumento: 'DNI' })}
              style={{ flex: 1 }}
            >
              <User size={14} /> Persona
            </button>
            <button
              className={`btn ${quickForm.tipoCliente === 'EMPRESA' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setQuickForm({ ...quickForm, tipoCliente: 'EMPRESA', tipoDocumento: 'RUC' })}
              style={{ flex: 1 }}
            >
              <Building2 size={14} /> Empresa
            </button>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo Documento</label>
            <select value={quickForm.tipoDocumento} onChange={(e) => setQuickForm({ ...quickForm, tipoDocumento: e.target.value })}>
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">Carné Extranjería</option>
            </select>
          </div>
          <div className="form-group">
            <label>N° Documento</label>
            <input
              value={quickForm.numeroDocumento}
              onChange={(e) => setQuickForm({ ...quickForm, numeroDocumento: e.target.value.replace(/\D/g, '') })}
              placeholder={quickForm.tipoDocumento === 'RUC' ? '20XXXXXXXXX' : quickForm.tipoDocumento === 'CE' ? 'XXXXXXXXX' : 'XXXXXXXX'}
              maxLength={quickForm.tipoDocumento === 'RUC' ? 11 : quickForm.tipoDocumento === 'CE' ? 12 : 8}
            />
          </div>
        </div>
        <div className="form-group">
          <label>{quickForm.tipoCliente === 'EMPRESA' ? 'Nombre Comercial' : 'Nombre Completo'} *</label>
          <input
            value={quickForm.name}
            onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
            placeholder={quickForm.tipoCliente === 'EMPRESA' ? 'Nombre comercial' : 'Nombre completo'}
            autoFocus
          />
        </div>
        {quickForm.tipoCliente === 'EMPRESA' && (
          <div className="form-group">
            <label>Razón Social</label>
            <input
              value={quickForm.razonSocial}
              onChange={(e) => setQuickForm({ ...quickForm, razonSocial: e.target.value })}
              placeholder="Razón social según SUNAT"
            />
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label>Teléfono</label>
            <input 
              value={quickForm.phone} 
              onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value.replace(/\D/g, '') })} 
              placeholder="999 999 999" 
              maxLength={9} 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={quickForm.email} onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })} placeholder="correo@email.com" />
          </div>
        </div>
        <div className="form-group">
          <label>Dirección</label>
          <input value={quickForm.address} onChange={(e) => setQuickForm({ ...quickForm, address: e.target.value })} placeholder="Dirección fiscal" />
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setShowQuickRegister(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleQuickRegister} disabled={registerLoading || !quickForm.name}>
            {registerLoading ? 'Guardando...' : 'Registrar y Seleccionar'}
          </button>
        </div>
        {toast && (
          <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`} style={{ position: 'relative', marginTop: '8px' }}>
            {toast.message}
          </div>
        )}
      </Modal>
    </div>
  );
}
