import { FileText } from 'lucide-react';

export default function ImpuestosCard({ form, setForm }) {
  const set = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  return (
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
              onChange={(e) => set({ taxRate: Number(e.target.value), igvPorcentaje: Number(e.target.value) })}
              min={0} max={100} step={0.5}
            />
          </div>
          <div className="form-group">
            <label>Moneda</label>
            <select
              value={form.moneda || 'PEN'}
              onChange={(e) => set({ moneda: e.target.value, currency: e.target.value === 'PEN' ? 'S/.' : '$' })}
            >
              <option value="PEN">S/. Sol Peruano</option>
              <option value="USD">$ Dólar Americano</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
