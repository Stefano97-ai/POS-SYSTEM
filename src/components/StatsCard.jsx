export default function StatsCard({ icon: Icon, title, value, subtitle, color = 'primary' }) {
  return (
    <div className="kpi-card" style={{ padding: '1.25rem' }}>
      <div className="kpi-header" style={{ marginBottom: '0.75rem' }}>
        <div className="kpi-icon-wrapper" style={{ background: color === 'success' ? 'rgba(16, 185, 129, 0.1)' : color === 'primary' ? 'rgba(27, 94, 55, 0.1)' : color === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: color === 'success' ? '#10B981' : color === 'primary' ? 'var(--color-primary)' : color === 'warning' ? '#F59E0B' : '#3B82F6', width: '32px', height: '32px' }}>
          <Icon size={18} />
        </div>
        <span className="kpi-title" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div>
        <span className="kpi-value" style={{ fontSize: '1.75rem' }}>{value}</span>
        {subtitle && <span className="kpi-subtext" style={{ marginTop: '0.25rem' }}>{subtitle}</span>}
      </div>
    </div>
  );
}
