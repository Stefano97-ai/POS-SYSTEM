export default function StatsCard({ icon: Icon, title, value, subtitle, color = 'primary' }) {
  return (
    <div className="stats-card">
      <div className={`stats-card-icon ${color}`}>
        <Icon size={24} />
      </div>
      <div className="stats-card-info">
        <span className="stats-card-title">{title}</span>
        <span className="stats-card-value">{value}</span>
        {subtitle && <span className="stats-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
