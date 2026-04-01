import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  Save,
  RotateCcw,
  Store,
  FileText,
  ShieldCheck,
  Globe,
  Key,
  Hash,
  AlertCircle,
  Upload,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Settings() {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({ ...state.settings });
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [certFile, setCertFile] = useState(null);
  const certInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load series on mount
  useEffect(() => {
    const loadSeries = async () => {
      try {
        const data = await api.getSeries();
        setSeries(Array.isArray(data) ? data : []);
      } catch {
        // Backend may not have series endpoint yet
        setSeries([
          { id: '1', tipoComprobante: 'BOLETA', serie: 'B001', correlativo: 1, activo: true },
          { id: '2', tipoComprobante: 'FACTURA', serie: 'F001', correlativo: 1, activo: true },
          { id: '3', tipoComprobante: 'NOTA_CREDITO', serie: 'BC01', correlativo: 1, activo: true },
          { id: '4', tipoComprobante: 'NOTA_DEBITO', serie: 'BD01', correlativo: 1, activo: true },
        ]);
      }
    };
    loadSeries();
  }, []);

  // Keep form in sync when settings change externally
  useEffect(() => {
    setForm({ ...state.settings });
  }, [state.settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const saved = await api.updateSettings(form);
      dispatch({ type: 'UPDATE_SETTINGS', payload: saved });
      showToast('Configuración guardada');
    } catch {
      showToast('Error al guardar configuración', 'error');
    }
    setLoading(false);
  };

  const handleUpdateSerie = async (id, newSerie) => {
    try {
      const updated = await api.updateSerie(id, newSerie);
      setSeries(series.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    } catch {
      showToast('Error actualizando serie', 'error');
    }
  };

  const handleReset = () => {
    if (!window.confirm('¿Restaurar toda la configuración a valores de fábrica? Esta acción no se puede deshacer.')) return;
    dispatch({ type: 'RESET_DATA' });
    setForm({ ...state.settings });
    showToast('Datos restaurados');
  };

  const handleCertUpload = () => {
    if (certInputRef.current) certInputRef.current.click();
  };

  const handleCertFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertFile(file);
      showToast(`Certificado "${file.name}" cargado. Guardar para aplicar.`);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Empresa, facturación electrónica, series y conexión OSE</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            <Save size={16} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* ===== COLUMN 1 ===== */}
        <div className="settings-column">

          {/* Datos de la Empresa */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon primary"><Store size={18} /></div>
              <h2>Datos de la Empresa (Emisor)</h2>
            </div>
            <div className="settings-card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>RUC *</label>
                  <input
                    value={form.ruc || ''}
                    onChange={(e) => setForm({ ...form, ruc: e.target.value.replace(/\D/g, '') })}
                    maxLength={11}
                    placeholder="10095470837"
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Razón Social *</label>
                  <input
                    value={form.razonSocial || ''}
                    onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
                    placeholder="Nombre legal completo"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nombre Comercial</label>
                <input
                  value={form.nombreComercial || form.businessName || ''}
                  onChange={(e) => setForm({ ...form, nombreComercial: e.target.value, businessName: e.target.value })}
                  placeholder="Nombre visible para clientes"
                />
              </div>

              <div className="form-group">
                <label>Dirección Fiscal</label>
                <input
                  value={form.direccion || form.address || ''}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value, address: e.target.value })}
                  placeholder="Dirección registrada en SUNAT"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ubigeo</label>
                  <input
                    value={form.ubigeo || ''}
                    onChange={(e) => setForm({ ...form, ubigeo: e.target.value })}
                    placeholder="150106"
                    maxLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    value={form.telefono || form.phone || ''}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value, phone: e.target.value })}
                    placeholder="991 900 034"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="empresa@mail.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Series de Comprobantes */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon info"><Hash size={18} /></div>
              <h2>Series y Correlativos</h2>
            </div>
            <div className="settings-card-body">
              <div className="table-container" style={{ background: 'transparent' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tipo Comprobante</th>
                      <th>Serie</th>
                      <th>Correlativo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.length > 0 ? series.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.tipoComprobante}</td>
                        <td>
                          <input
                            value={s.serie || ''}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setSeries(series.map((x) => (x.id === s.id ? { ...x, serie: val } : x)));
                            }}
                            onBlur={() => handleUpdateSerie(s.id, s.serie)}
                            style={{ width: '80px', padding: '4px 8px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                          />
                        </td>
                        <td className="text-muted">{s.correlativo || 1}</td>
                        <td>
                          <span className={`stock-badge ${s.activo !== false ? 'success' : 'low'}`}>
                            {s.activo !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)' }}>Cargando series...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="settings-note">
                <AlertCircle size={14} />
                <span>Las series deben estar autorizadas por SUNAT para su RUC. Cambiarlas afectará los nuevos comprobantes.</span>
              </div>
            </div>
          </div>

          {/* Impuestos y Moneda */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon warning"><FileText size={18} /></div>
              <h2>Impuestos y Moneda</h2>
            </div>
            <div className="settings-card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>IGV (%)</label>
                  <input
                    type="number"
                    value={form.taxRate || form.igvPorcentaje || 18}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value), igvPorcentaje: Number(e.target.value) })}
                    min={0} max={100} step={0.5}
                  />
                </div>
                <div className="form-group">
                  <label>Moneda</label>
                  <select
                    value={form.moneda || 'PEN'}
                    onChange={(e) => setForm({
                      ...form,
                      moneda: e.target.value,
                      currency: e.target.value === 'PEN' ? 'S/.' : '$',
                    })}
                  >
                    <option value="PEN">S/. Sol Peruano</option>
                    <option value="USD">$ Dólar Americano</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== COLUMN 2 ===== */}
        <div className="settings-column">

          {/* Integración OSE / SUNAT */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon success"><Globe size={18} /></div>
              <h2>Integración SUNAT / OSE</h2>
            </div>
            <div className="settings-card-body">
              <div className="form-group">
                <label>Proveedor OSE / PSE</label>
                <select
                  value={form.oseProvider || 'SUNAT'}
                  onChange={(e) => setForm({ ...form, oseProvider: e.target.value })}
                >
                  <option value="SUNAT">Conexión Directa SUNAT (Clave SOL)</option>
                  <option value="NUBEFACT">Nubefact</option>
                  <option value="EBIS">EBIS OSE</option>
                  <option value="EFACT">eFact</option>
                  <option value="CUSTOM">Servidor Personalizado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Usuario SOL / API User</label>
                <input
                  value={form.oseUsuario || ''}
                  onChange={(e) => setForm({ ...form, oseUsuario: e.target.value })}
                  placeholder="MODDATOS / usuario API"
                />
              </div>

              <div className="form-group">
                <label>Clave SOL / API Token</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={form.oseApiToken || form.oseClaveSol || ''}
                    onChange={(e) => setForm({ ...form, oseApiToken: e.target.value, oseClaveSol: e.target.value })}
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
                    }}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>URL del Servicio (Producción)</label>
                <input
                  value={form.oseApiUrl || ''}
                  onChange={(e) => setForm({ ...form, oseApiUrl: e.target.value })}
                  placeholder="https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService"
                />
              </div>

              <div className="form-group">
                <label>URL Beta (Pruebas)</label>
                <input
                  value={form.oseApiUrlBeta || ''}
                  onChange={(e) => setForm({ ...form, oseApiUrlBeta: e.target.value })}
                  placeholder="https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Modo</label>
                  <select
                    value={form.oseMode || 'BETA'}
                    onChange={(e) => setForm({ ...form, oseMode: e.target.value })}
                  >
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

          {/* Certificado Digital */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon primary"><ShieldCheck size={18} /></div>
              <h2>Certificado Digital</h2>
            </div>
            <div className="settings-card-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                El certificado digital (.pfx / .p12) es requerido para firmar los comprobantes electrónicos ante SUNAT.
              </p>

              <div className="settings-cert-box">
                <div className="settings-cert-info">
                  <ShieldCheck size={20} style={{ color: certFile ? 'var(--color-warning)' : 'var(--color-success)' }} />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {certFile ? certFile.name : (form.certFileName || 'importaciones_nunez.pfx')}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: certFile ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      {certFile ? 'Pendiente de guardar' : `Válido hasta: ${form.certExpiry || '12 Dic 2026'}`}
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleCertUpload}>
                  <Upload size={14} /> Reemplazar
                </button>
                <input
                  ref={certInputRef}
                  type="file"
                  accept=".pfx,.p12"
                  style={{ display: 'none' }}
                  onChange={handleCertFileChange}
                />
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label>Contraseña del Certificado</label>
                <input
                  type="password"
                  value={form.certPassword || ''}
                  onChange={(e) => setForm({ ...form, certPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="settings-note">
                <AlertCircle size={14} />
                <span>Nunca comparta su certificado digital ni su contraseña. Se almacena de forma segura en el servidor.</span>
              </div>
            </div>
          </div>

          {/* Impresora */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon warning"><Printer size={18} /></div>
              <h2>Impresora de Tickets</h2>
            </div>
            <div className="settings-card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Impresora</label>
                  <select
                    value={form.printerType || 'TERMICA'}
                    onChange={(e) => setForm({ ...form, printerType: e.target.value })}
                  >
                    <option value="TERMICA">Térmica 80mm</option>
                    <option value="TERMICA_58">Térmica 58mm</option>
                    <option value="A4">Impresora A4</option>
                    <option value="NINGUNA">Sin impresora</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Copias por Comprobante</label>
                  <input
                    type="number"
                    value={form.printerCopies || 1}
                    onChange={(e) => setForm({ ...form, printerCopies: Number(e.target.value) })}
                    min={1} max={5}
                  />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={form.autoPrint || false}
                    onChange={(e) => setForm({ ...form, autoPrint: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  Imprimir automáticamente al completar venta
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button className="btn btn-danger" onClick={handleReset}>
          <RotateCcw size={16} /> Restaurar Valores de Fábrica
        </button>
      </div>

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
