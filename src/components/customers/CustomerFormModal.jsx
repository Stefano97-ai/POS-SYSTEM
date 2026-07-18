import { useState, useEffect } from 'react';
import { User, Building2 } from 'lucide-react';
import Modal from '../Modal';

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

const EMPTY = {
  name: '', email: '', phone: '', address: '', notes: '',
  tipoDocumento: 'DNI', numeroDocumento: '', tipoCliente: 'PERSONA', razonSocial: '', clasificacion: 'NUEVO',
};

export default function CustomerFormModal({ isOpen, onClose, onSave, editCustomer }) {
  const [form, setForm] = useState(EMPTY);
  const set = (fields) => setForm((prev) => ({ ...prev, ...fields }));

  useEffect(() => {
    if (editCustomer) {
      set({
        name: editCustomer.name || editCustomer.nombre || '',
        email: editCustomer.email || '',
        phone: editCustomer.phone || editCustomer.telefono || '',
        address: editCustomer.address || editCustomer.direccion || '',
        notes: editCustomer.notes || editCustomer.notas || '',
        tipoDocumento: editCustomer.tipoDocumento || 'DNI',
        numeroDocumento: editCustomer.numeroDocumento || '',
        tipoCliente: editCustomer.tipoCliente || 'PERSONA',
        razonSocial: editCustomer.razonSocial || '',
        clasificacion: editCustomer.clasificacion || 'NUEVO',
      });
    } else {
      setForm(EMPTY);
    }
  }, [editCustomer, isOpen]);

  const handleTipoClienteChange = (tipo) => {
    set({ tipoCliente: tipo, tipoDocumento: tipo === 'EMPRESA' ? 'RUC' : 'DNI', clasificacion: tipo === 'EMPRESA' ? 'CORPORATIVO' : form.clasificacion });
  };

  const handleSave = () => {
    if (!form.name) return;
    if (form.tipoCliente === 'EMPRESA' && !form.razonSocial) { alert('La razón social es obligatoria para empresas'); return; }
    if (form.tipoDocumento === 'RUC' && (!form.numeroDocumento || form.numeroDocumento.length !== 11)) { alert('El RUC debe tener 11 dígitos'); return; }
    if (form.tipoDocumento === 'DNI' && form.numeroDocumento && form.numeroDocumento.length !== 8) { alert('El DNI debe tener 8 dígitos'); return; }
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editCustomer ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
      <div className="form-group">
        <label>Tipo de Cliente</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className={`btn ${form.tipoCliente === 'PERSONA' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleTipoClienteChange('PERSONA')} style={{ flex: 1 }}>
            <User size={16} /> Persona
          </button>
          <button type="button" className={`btn ${form.tipoCliente === 'EMPRESA' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleTipoClienteChange('EMPRESA')} style={{ flex: 1 }}>
            <Building2 size={16} /> Empresa
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tipo de Documento</label>
          <select value={form.tipoDocumento} onChange={(e) => set({ tipoDocumento: e.target.value })}>
            {TIPO_DOC_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Número de Documento</label>
          <input
            value={form.numeroDocumento}
            onChange={(e) => set({ numeroDocumento: e.target.value.replace(/\D/g, '') })}
            placeholder={form.tipoDocumento === 'RUC' ? '20XXXXXXXXX' : 'XXXXXXXX'}
            maxLength={form.tipoDocumento === 'RUC' ? 11 : form.tipoDocumento === 'DNI' ? 8 : 20}
          />
        </div>
      </div>

      <div className="form-group">
        <label>{form.tipoCliente === 'EMPRESA' ? 'Nombre Comercial' : 'Nombre Completo'}</label>
        <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder={form.tipoCliente === 'EMPRESA' ? 'Nombre comercial' : 'Nombre completo'} />
      </div>

      {form.tipoCliente === 'EMPRESA' && (
        <div className="form-group">
          <label>Razón Social *</label>
          <input value={form.razonSocial} onChange={(e) => set({ razonSocial: e.target.value })} placeholder="Razón social según SUNAT" />
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="correo@email.com" />
        </div>
        <div className="form-group">
          <label>Teléfono</label>
          <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="999 999 999" />
        </div>
      </div>

      <div className="form-group">
        <label>Dirección</label>
        <input value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Dirección fiscal completa" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Clasificación</label>
          <select value={form.clasificacion} onChange={(e) => set({ clasificacion: e.target.value })}>
            {CLASIFICACION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Notas</label>
          <input value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Notas adicionales..." />
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>{editCustomer ? 'Guardar Cambios' : 'Agregar Cliente'}</button>
      </div>
    </Modal>
  );
}
