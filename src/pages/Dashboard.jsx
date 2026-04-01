import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  formatCurrency,
  isToday,
  isThisMonth,
  isThisWeek,
  getPaymentMethodLabel,
  getTipoComprobanteLabel,
} from '../utils/helpers';
import StatsCard from '../components/StatsCard';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Package,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#6C5CE7', '#00CEC9', '#FDCB6E', '#FF6B6B', '#74B9FF', '#00B894', '#E17055'];

const chartTooltipStyle = {
  backgroundColor: '#1A1A2E',
  border: '1px solid #2D2D44',
  borderRadius: '8px',
  fontSize: '0.8rem',
};

export default function Dashboard() {
  const { state } = useApp();
  const { sales, products, customers, settings } = state;
  const currency = settings.currency || 'S/.';
  const [downloading, setDownloading] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const todaySales = sales.filter((s) => isToday(s.date || s.createdAt));
    const weekSales = sales.filter((s) => isThisWeek(s.date || s.createdAt));
    const monthSales = sales.filter((s) => isThisMonth(s.date || s.createdAt));

    const todayTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const weekTotal = weekSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const monthTotal = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const todayItems = todaySales.reduce(
      (sum, s) => sum + (s.items || s.detalles || []).reduce((a, i) => a + (i.quantity || i.cantidad || 0), 0),
      0
    );
    const stockBajo = products.filter((p) => (p.stock || 0) <= (p.stockMinimo || 5));

    return {
      todayTotal, weekTotal, monthTotal, todayItems,
      todayCount: todaySales.length, monthCount: monthSales.length,
      stockBajoCount: stockBajo.length,
      stockBajoList: stockBajo.sort((a, b) => (a.stock || 0) - (b.stock || 0)).slice(0, 5),
    };
  }, [sales, products]);

  // Chart: Sales trend (last 7 days)
  const trendData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const daySales = sales.filter((s) => new Date(s.date || s.createdAt).toDateString() === d.toDateString());
      return {
        name: d.toLocaleDateString('es-PE', { weekday: 'short' }),
        total: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
        count: daySales.length,
      };
    });
  }, [sales]);

  // Chart: Payment methods
  const paymentData = useMemo(() => {
    const methods = {};
    sales.filter((s) => isThisMonth(s.date || s.createdAt)).forEach((s) => {
      const m = s.paymentMethod || s.metodoPago || 'EFECTIVO';
      methods[m] = (methods[m] || 0) + (s.total || 0);
    });
    return Object.entries(methods).map(([name, value]) => ({
      name: getPaymentMethodLabel(name),
      value,
    }));
  }, [sales]);

  // Chart: Sales by category
  const categoryData = useMemo(() => {
    const cats = {};
    sales.filter((s) => isThisMonth(s.date || s.createdAt)).forEach((s) => {
      (s.items || s.detalles || []).forEach((item) => {
        const cat = item.category || item.categoria || 'Otros';
        const qty = item.quantity || item.cantidad || 0;
        cats[cat] = (cats[cat] || 0) + qty;
      });
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [sales]);

  // Top products
  const topProducts = useMemo(() => {
    const counts = {};
    sales.forEach((s) => {
      (s.items || s.detalles || []).forEach((item) => {
        const name = item.name || item.nombre || item.productoNombre || 'Desconocido';
        counts[name] = (counts[name] || 0) + (item.quantity || item.cantidad || 0);
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sales]);

  // Recent sales
  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);

  const handleExportExcel = async () => {
    setDownloading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const data = await api.exportarExcel(hace30, hoy);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Ventas_${hoy}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar');
    }
    setDownloading(false);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen de rendimiento y métricas</p>
        </div>
        <button className="btn btn-primary" onClick={handleExportExcel} disabled={downloading}>
          <Download size={16} /> {downloading ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <StatsCard
          icon={DollarSign}
          title="Ventas del Día"
          value={formatCurrency(stats.todayTotal, currency)}
          subtitle={`${stats.todayCount} ventas hoy`}
          color="success"
        />
        <StatsCard
          icon={TrendingUp}
          title="Ventas del Mes"
          value={formatCurrency(stats.monthTotal, currency)}
          subtitle={`Semana: ${formatCurrency(stats.weekTotal, currency)}`}
          color="primary"
        />
        <StatsCard
          icon={ShoppingBag}
          title="Items Vendidos Hoy"
          value={`${stats.todayItems} uds.`}
          subtitle={`En ${stats.todayCount} comprobantes`}
          color="warning"
        />
        <StatsCard
          icon={Users}
          title="Clientes"
          value={customers.length}
          subtitle="Registrados"
          color="info"
        />
      </div>

      {/* Charts row 1 */}
      <div className="dash-charts-row">
        {/* Area chart: 7-day trend */}
        <div className="dash-chart-card dash-chart-wide">
          <div className="dash-chart-header">
            <h3 className="section-title" style={{ margin: 0 }}>Tendencia de Ventas (7 días)</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> Última semana
            </span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D44" vertical={false} />
                <XAxis dataKey="name" stroke="#6B6B80" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B6B80" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [formatCurrency(v, currency), 'Ventas']} />
                <Area type="monotone" dataKey="total" stroke="#6C5CE7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart: payment methods */}
        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Por Método de Pago</h3>
          {paymentData.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => formatCurrency(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-legend">
                {paymentData.map((item, i) => (
                  <div key={i} className="dash-legend-item">
                    <span className="dash-legend-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="dash-legend-label">{item.name}</span>
                    <span className="dash-legend-value">{formatCurrency(item.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Sin datos este mes</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="dash-charts-row">
        {/* Top products */}
        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Productos Más Vendidos</h3>
          {topProducts.length > 0 ? (
            <div className="table-container" style={{ background: 'transparent' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="text-accent">{p.value} uds</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Sin ventas registradas</div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="dash-chart-card">
          <div className="dash-chart-header">
            <h3 className="section-title" style={{ margin: 0 }}>Alertas de Inventario</h3>
            {stats.stockBajoCount > 0 && (
              <span className="stock-badge critical">{stats.stockBajoCount} alertas</span>
            )}
          </div>
          {stats.stockBajoCount > 0 ? (
            <div className="dash-alert-list">
              {stats.stockBajoList.map((p) => (
                <div key={p.id} className="dash-alert-item">
                  <div className="dash-alert-icon">
                    <Package size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block' }}>{p.name || p.nombre}</span>
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
      </div>

      {/* Recent sales */}
      {recentSales.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 className="section-title">Últimas Ventas</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Comprobante</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id}>
                    <td><span className="invoice-badge">{s.invoiceNumber || s.numeroVenta}</span></td>
                    <td><span className={`tipo-badge tipo-${(s.tipoComprobante || 'boleta').toLowerCase()}`}>{getTipoComprobanteLabel(s.tipoComprobante || 'BOLETA')}</span></td>
                    <td>{s.customer?.name || s.customer?.nombre || s.clienteNombre || 'Cliente General'}</td>
                    <td className="text-accent">{formatCurrency(s.total, currency)}</td>
                    <td><span className="method-badge">{getPaymentMethodLabel(s.paymentMethod || s.metodoPago)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
