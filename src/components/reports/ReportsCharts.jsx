import { formatCurrency } from '../../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#6C5CE7', '#00CEC9', '#FDCB6E', '#FF6B6B', '#74B9FF', '#00B894', '#E17055'];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '0.8rem',
  color: 'var(--color-text-main)',
  boxShadow: 'var(--shadow-md)',
};

export default function ReportsCharts({ dailyData, comprobanteData, paymentData, topProducts, currency }) {
  return (
    <>
      <div className="dash-charts-row">
        <div className="dash-chart-card dash-chart-wide">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Ventas por Día</h3>
          {dailyData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D44" vertical={false} />
                  <XAxis dataKey="label" stroke="#6B6B80" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B6B80" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v, currency), 'Total']} />
                  <Bar dataKey="total" fill="#6C5CE7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin datos para el rango seleccionado</div>
          )}
        </div>

        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Por Tipo de Comprobante</h3>
          {comprobanteData.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={comprobanteData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="total">
                      {comprobanteData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-legend">
                {comprobanteData.map((item, i) => (
                  <div key={i} className="dash-legend-item">
                    <span className="dash-legend-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="dash-legend-label">{item.name}</span>
                    <span className="dash-legend-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin datos</div>
          )}
        </div>
      </div>

      <div className="dash-charts-row">
        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Métodos de Pago</h3>
          {paymentData.length > 0 ? (
            <div className="table-container-premium">
              <table className="table-premium" style={{ minWidth: '100%' }}>
                <thead><tr><th>Método</th><th style={{ textAlign: 'right' }}>Ventas</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                <tbody>
                  {paymentData.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span className="dash-legend-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {p.name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.count}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="cell-currency">{formatCurrency(p.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Sin datos</div>
          )}
        </div>

        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Top 10 Productos</h3>
          {topProducts.length > 0 ? (
            <div className="table-container-premium">
              <table className="table-premium" style={{ minWidth: '100%' }}>
                <thead><tr><th>#</th><th>Producto</th><th style={{ textAlign: 'right' }}>Cant.</th><th style={{ textAlign: 'right' }}>Ingresos</th></tr></thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td className="cell-primary" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ textAlign: 'right' }}>{p.qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="cell-currency">{formatCurrency(p.revenue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Sin datos</div>
          )}
        </div>
      </div>
    </>
  );
}
