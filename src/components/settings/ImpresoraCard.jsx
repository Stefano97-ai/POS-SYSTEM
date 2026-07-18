import { Printer } from 'lucide-react';

export default function ImpresoraCard({ form, setForm }) {
  const set = (fields) => setForm((prev) => ({ ...prev, ...fields }));
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-card-icon warning"><Printer size={18} /></div>
        <h2>Impresora de Tickets</h2>
      </div>
      <div className="settings-card-body">
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Impresora</label>
            <select value={form.printerType || 'TERMICA'} onChange={(e) => set({ printerType: e.target.value })}>
              <option value="TERMICA">Térmica 80mm</option>
              <option value="TERMICA_58">Térmica 58mm</option>
              <option value="A4">Impresora A4</option>
              <option value="NINGUNA">Sin impresora</option>
            </select>
          </div>
          <div className="form-group">
            <label>Copias por Comprobante</label>
            <input type="number" value={form.printerCopies || 1} onChange={(e) => set({ printerCopies: Number(e.target.value) })} min={1} max={5} />
          </div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={form.autoPrint || false} onChange={(e) => set({ autoPrint: e.target.checked })} style={{ width: 'auto' }} />
            Imprimir automáticamente al completar venta
          </label>
        </div>
      </div>
    </div>
  );
}
