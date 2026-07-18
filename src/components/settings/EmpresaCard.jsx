import { Store } from 'lucide-react';

export default function EmpresaCard({ form, setForm }) {
  const set = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-card-icon primary"><Store size={18} /></div>
        <h2>Datos de la Empresa (Emisor)</h2>
      </div>
      <div className="settings-card-body">
        <div className="form-row">
          <div className="form-group">
            <label>RUC *</label>
            <input value={form.ruc || ''} onChange={(e) => set({ ruc: e.target.value.replace(/\D/g, '') })} maxLength={11} placeholder="10095470837" />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Razón Social *</label>
            <input value={form.razonSocial || ''} onChange={(e) => set({ razonSocial: e.target.value })} placeholder="Nombre legal completo" />
          </div>
        </div>

        <div className="form-group">
          <label>Nombre Comercial</label>
          <input
            value={form.nombreComercial || form.businessName || ''}
            onChange={(e) => set({ nombreComercial: e.target.value, businessName: e.target.value })}
            placeholder="Nombre visible para clientes"
          />
        </div>

        <div className="form-group">
          <label>Dirección Fiscal</label>
          <input
            value={form.direccion || form.address || ''}
            onChange={(e) => set({ direccion: e.target.value, address: e.target.value })}
            placeholder="Dirección registrada en SUNAT"
          />
        </div>

        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label>URL del Logo (Imagen)</label>
          <input 
            value={form.logoUrl || ''} 
            onChange={(e) => set({ logoUrl: e.target.value })} 
            placeholder="Ej: https://miweb.com/logo.png o /assets/logo.png" 
          />
          <small style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Se recomienda una imagen cuadrada de fondo transparente.
          </small>
        </div>

        <div className="form-row" style={{ marginTop: '0.75rem' }}>
          <div className="form-group">
            <label>Ubigeo</label>
            <input value={form.ubigeo || ''} onChange={(e) => set({ ubigeo: e.target.value })} placeholder="150106" maxLength={6} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input value={form.telefono || form.phone || ''} onChange={(e) => set({ telefono: e.target.value, phone: e.target.value })} placeholder="991 900 034" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email || ''} onChange={(e) => set({ email: e.target.value })} placeholder="empresa@mail.com" />
          </div>
        </div>
      </div>
    </div>
  );
}
