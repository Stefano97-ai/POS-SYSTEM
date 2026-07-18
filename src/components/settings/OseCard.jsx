import { useState } from 'react';
import { Globe, Eye, EyeOff } from 'lucide-react';

export default function OseCard({ form, setForm }) {
  const [showToken, setShowToken] = useState(false);
  const set = (fields) => setForm((prev) => ({ ...prev, ...fields }));

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-card-icon success"><Globe size={18} /></div>
        <h2>Integración SUNAT / OSE</h2>
      </div>
      <div className="settings-card-body">
        <div className="form-group">
          <label>Proveedor OSE / PSE</label>
          <select value={form.oseProvider || 'SUNAT'} onChange={(e) => set({ oseProvider: e.target.value })}>
            <option value="SUNAT">Conexión Directa SUNAT (Clave SOL)</option>
            <option value="NUBEFACT">Nubefact</option>
            <option value="EBIS">EBIS OSE</option>
            <option value="EFACT">eFact</option>
            <option value="CUSTOM">Servidor Personalizado</option>
          </select>
        </div>

        <div className="form-group">
          <label>Usuario SOL / API User</label>
          <input value={form.oseUsuarioSol || ''} onChange={(e) => set({ oseUsuarioSol: e.target.value })} placeholder="MODDATOS" />
        </div>

        <div className="form-group">
          <label>Clave SOL / API Token</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showToken ? 'text' : 'password'}
              value={form.oseApiToken || form.oseClaveSol || ''}
              onChange={(e) => set({ oseApiToken: e.target.value, oseClaveSol: e.target.value })}
              placeholder="••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>URL del Servicio (Producción)</label>
          <input value={form.oseApiUrl || ''} onChange={(e) => set({ oseApiUrl: e.target.value })} placeholder="https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService" />
        </div>

        <div className="form-group">
          <label>URL Beta (Pruebas)</label>
          <input value={form.oseApiUrlBeta || ''} onChange={(e) => set({ oseApiUrlBeta: e.target.value })} placeholder="https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Modo</label>
            <select value={form.oseMode || 'BETA'} onChange={(e) => set({ oseMode: e.target.value })}>
              <option value="BETA">Beta (Pruebas)</option>
              <option value="PRODUCCION">Producción</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado de Conexión</label>
            <div className="settings-connection-status">
              <span className={`stock-badge ${form.oseMode === 'PRODUCCION' ? 'success' : 'info'}`}>
                {form.oseMode === 'PRODUCCION' ? 'Producción' : 'Beta / Pruebas'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
