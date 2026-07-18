import { useState, useEffect } from 'react';
import { Hash, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

const DEFAULT_SERIES = [
  { id: '1', tipoComprobante: 'BOLETA', serie: 'B001', correlativo: 1, activo: true },
  { id: '2', tipoComprobante: 'FACTURA', serie: 'F001', correlativo: 1, activo: true },
  { id: '3', tipoComprobante: 'NOTA_CREDITO', serie: 'BC01', correlativo: 1, activo: true },
  { id: '4', tipoComprobante: 'NOTA_DEBITO', serie: 'BD01', correlativo: 1, activo: true },
];

export default function SeriesCard({ showToast }) {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    api.getSeries()
      .then((data) => setSeries(Array.isArray(data) ? data : []))
      .catch(() => setSeries(DEFAULT_SERIES));
  }, []);

  const handleUpdateSerie = async (id, newSerie) => {
    try {
      const updated = await api.updateSerie(id, newSerie);
      setSeries((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    } catch {
      showToast('Error actualizando serie', 'error');
    }
  };

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-card-icon info"><Hash size={18} /></div>
        <h2>Series y Correlativos</h2>
      </div>
      <div className="settings-card-body" style={{ padding: 0 }}>
        <div className="table-container-premium" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <table className="table-premium">
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
                  <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.tipoComprobante}</td>
                  <td>
                    <input
                      value={s.serie || ''}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setSeries((prev) => prev.map((x) => (x.id === s.id ? { ...x, serie: val } : x)));
                      }}
                      onBlur={() => handleUpdateSerie(s.id, s.serie)}
                      style={{ width: '80px', padding: '6px 10px', fontSize: '0.85rem', fontFamily: 'monospace', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}
                    />
                  </td>
                  <td className="cell-muted">{s.correlativo || 1}</td>
                  <td>
                    <span className={`badge-premium ${s.activo !== false ? 'success' : 'danger'}`}>
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
        <div className="settings-note" style={{ margin: '1rem' }}>
          <AlertCircle size={16} />
          <span>Las series deben estar autorizadas por SUNAT para su RUC. Cambiarlas afectará los nuevos comprobantes.</span>
        </div>
      </div>
    </div>
  );
}
