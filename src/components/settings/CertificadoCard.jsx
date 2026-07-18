import { useRef } from 'react';
import { ShieldCheck, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CertificadoCard({ form, setForm, showToast }) {
  const certInputRef = useRef(null);
  const set = (fields) => setForm((prev) => ({ ...prev, ...fields }));

  const handleCertFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      set({ certFile: file });
      showToast(`Certificado "${file.name}" cargado. Guardar para aplicar.`);
    }
  };

  // Extraer el nombre del archivo desde la ruta del servidor (ej: C:\Users\...\.pos-certs\cert.p12 → cert.p12)
  const rutaServidor = form.certificadoDigitalPath || '';
  const nombreEnServidor = rutaServidor
    ? rutaServidor.split(/[\\/]/).pop()
    : null;

  // Determinar qué mostrar
  const tieneCertPendiente = !!form.certFile;
  const tieneCertEnServidor = !!nombreEnServidor;

  const nombreMostrar = tieneCertPendiente
    ? form.certFile.name
    : (nombreEnServidor || form.certFileName || null);

  const estadoTexto = tieneCertPendiente
    ? 'Pendiente de guardar'
    : tieneCertEnServidor
      ? '✓ Activo en servidor'
      : 'Sin configurar';

  const estadoColor = tieneCertPendiente
    ? 'var(--color-warning)'
    : tieneCertEnServidor
      ? 'var(--color-success)'
      : 'var(--color-text-muted)';

  const iconColor = tieneCertPendiente
    ? 'var(--color-warning)'
    : tieneCertEnServidor
      ? 'var(--color-success)'
      : 'var(--color-text-muted)';

  return (
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
            {tieneCertEnServidor && !tieneCertPendiente
              ? <CheckCircle2 size={20} style={{ color: iconColor, flexShrink: 0 }} />
              : <ShieldCheck size={20} style={{ color: iconColor, flexShrink: 0 }} />
            }
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {nombreMostrar || 'No hay certificado subido'}
              </span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: estadoColor }}>
                {estadoTexto}
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => certInputRef.current?.click()}>
            <Upload size={14} /> {tieneCertEnServidor ? 'Reemplazar' : 'Subir'}
          </button>
          <input ref={certInputRef} type="file" accept=".pfx,.p12" style={{ display: 'none' }} onChange={handleCertFileChange} />
        </div>

        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label>Contraseña del Certificado</label>
          <input
            type="password"
            value={form.certPassword || form.certificadoDigitalPassword || ''}
            onChange={(e) => set({ certPassword: e.target.value, certificadoDigitalPassword: e.target.value })}
            placeholder={tieneCertEnServidor ? '(guardada en servidor)' : '••••••••'}
          />
        </div>

        <div className="settings-note">
          <AlertCircle size={14} />
          <span>Nunca comparta su certificado digital ni su contraseña. Se almacena de forma segura en el servidor.</span>
        </div>
      </div>
    </div>
  );
}

