import { RotateCcw } from 'lucide-react';

export default function ReportsFilters({ dateFrom, dateTo, setDateFrom, setDateTo, onSetRange }) {
  return (
    <div className="toolbar-premium" style={{ marginBottom: '1.5rem', borderRadius: '1.25rem' }}>
      <div className="reports-date-inputs" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Desde</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Hasta</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} />
        </div>
        {(dateFrom || dateTo) && (
          <button className="btn btn-ghost" onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ height: '38px', borderRadius: '0.75rem' }}>
            <RotateCcw size={16} /> Limpiar
          </button>
        )}
      </div>
      <div className="reports-quick-dates" style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-ghost" onClick={() => onSetRange(7)} style={{ borderRadius: '2rem', fontSize: '0.8rem' }}>7 días</button>
        <button className="btn btn-ghost" onClick={() => onSetRange(30)} style={{ borderRadius: '2rem', fontSize: '0.8rem' }}>30 días</button>
        <button className="btn btn-ghost" onClick={() => onSetRange(90)} style={{ borderRadius: '2rem', fontSize: '0.8rem' }}>3 meses</button>
        <button className="btn btn-primary" onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ borderRadius: '2rem', fontSize: '0.8rem' }}>Todo</button>
      </div>
    </div>
  );
}
