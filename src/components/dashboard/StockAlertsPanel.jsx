import { Package, CheckCircle2 } from 'lucide-react';

export default function StockAlertsPanel({ stockBajoList, stockBajoCount }) {
  return (
    <div className="dash-chart-card">
      <div className="dash-chart-header">
        <h3 className="section-title" style={{ margin: 0 }}>Alertas de Inventario</h3>
        {stockBajoCount > 0 && <span className="stock-badge critical">{stockBajoCount} alertas</span>}
      </div>
      {stockBajoCount > 0 ? (
        <div className="dash-alert-list">
          {stockBajoList.map((p) => (
            <div key={p.id} className="dash-alert-item">
              <div className="dash-alert-icon"><Package size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block' }}>{p.name}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Mín: {p.stockMinimo || 5}</span>
              </div>
              <span className={`stock-badge ${(p.stock || 0) === 0 ? 'critical' : 'low'}`}>{p.stock || 0}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
          <CheckCircle2 size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>Inventario en buen estado</p>
        </div>
      )}
    </div>
  );
}
