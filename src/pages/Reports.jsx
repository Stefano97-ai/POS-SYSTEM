import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  formatCurrency,
  formatShortDate,
  getPaymentMethodLabel,
  getTipoComprobanteLabel,
  calculateIGV,
  calculateSubtotalSinIGV,
} from '../utils/helpers';
import StatsCard from '../components/StatsCard';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Award,
  Download,
  RotateCcw,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#6C5CE7', '#00CEC9', '#FDCB6E', '#FF6B6B', '#74B9FF', '#00B894', '#E17055'];

const chartTooltipStyle = {
  backgroundColor: '#1A1A2E',
  border: '1px solid #2D2D44',
  borderRadius: '8px',
  fontSize: '0.8rem',
};

export default function Reports() {
  const { state } = useApp();
  const { sales, settings } = state;
  const currency = settings.currency || 'S/.';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Quick date ranges
  const setRange = (days) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 86400000);
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const d = new Date(s.date || s.createdAt).toISOString().split('T')[0];
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo]);

  // Summary stats
  const summary = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalIGV = filteredSales.reduce((sum, s) => sum + (s.tax || s.igv || calculateIGV(s.total || 0)), 0);
    const totalSubtotal = filteredSales.reduce((sum, s) => sum + (s.subtotal || calculateSubtotalSinIGV(s.total || 0)), 0);
    const avgSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    return { totalRevenue, totalIGV, totalSubtotal, avgSale, count: filteredSales.length };
  }, [filteredSales]);

  // Daily sales chart data
  const dailyData = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const d = new Date(s.date || s.createdAt).toISOString().split('T')[0];
      if (!map[d]) map[d] = { date: d, total: 0, count: 0 };
      map[d].total += s.total || 0;
      map[d].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        label: new Date(d.date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
      }));
  }, [filteredSales]);

  // Payment method breakdown
  const paymentData = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const m = s.paymentMethod || s.metodoPago || 'EFECTIVO';
      if (!map[m]) map[m] = { count: 0, total: 0 };
      map[m].count += 1;
      map[m].total += s.total || 0;
    });
    return Object.entries(map).map(([method, data]) => ({
      name: getPaymentMethodLabel(method),
      ...data,
    }));
  }, [filteredSales]);

  // Comprobante type breakdown
  const comprobanteData = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const t = s.tipoComprobante || 'BOLETA';
      if (!map[t]) map[t] = { count: 0, total: 0 };
      map[t].count += 1;
      map[t].total += s.total || 0;
    });
    return Object.entries(map).map(([tipo, data]) => ({
      name: getTipoComprobanteLabel(tipo),
      ...data,
    }));
  }, [filteredSales]);

  // Top products
  const topProducts = useMemo(() => {
    const counts = {};
    filteredSales.forEach((s) => {
      (s.items || s.detalles || []).forEach((item) => {
        const name = item.name || item.productName || item.productoNombre || 'Desconocido';
        const qty = item.quantity || item.cantidad || 0;
        const price = item.price || item.precioUnitario || 0;
        if (!counts[name]) counts[name] = { qty: 0, revenue: 0 };
        counts[name].qty += qty;
        counts[name].revenue += price * qty;
      });
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredSales]);

  // Export
  const handleExport = async () => {
    setDownloading(true);
    try {
      const desde = dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const hasta = dateTo || new Date().toISOString().split('T')[0];
      const data = await api.exportarExcel(desde, hasta);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Ventas_${desde}_${hasta}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Excel exportado');
    } catch {
      showToast('Error al exportar', 'error');
    }
    setDownloading(false);
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Reportes de Ventas</h1>
          <p className="page-subtitle">Análisis detallado con gráficos y exportación</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport} disabled={downloading}>
          <Download size={16} /> {downloading ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Date filters */}
      <div className="reports-filters">
        <div className="reports-date-inputs">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Desde</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Hasta</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ alignSelf: 'flex-end' }}>
              <RotateCcw size={14} /> Limpiar
            </button>
          )}
        </div>
        <div className="reports-quick-dates">
          <button className="btn btn-ghost btn-sm" onClick={() => setRange(7)}>7 días</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setRange(30)}>30 días</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setRange(90)}>3 meses</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Todo</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard
          icon={DollarSign}
          title="Ingresos Totales"
          value={formatCurrency(summary.totalRevenue, currency)}
          subtitle={`IGV: ${formatCurrency(summary.totalIGV, currency)}`}
          color="success"
        />
        <StatsCard
          icon={BarChart3}
          title="Ventas"
          value={summary.count}
          subtitle={`Op. Gravada: ${formatCurrency(summary.totalSubtotal, currency)}`}
          color="primary"
        />
        <StatsCard
          icon={TrendingUp}
          title="Promedio x Venta"
          value={formatCurrency(summary.avgSale, currency)}
          color="info"
        />
        <StatsCard
          icon={Award}
          title="Más Vendido"
          value={topProducts[0]?.name || 'N/A'}
          subtitle={topProducts[0] ? `${topProducts[0].qty} uds` : ''}
          color="warning"
        />
      </div>

      {/* Charts */}
      <div className="dash-charts-row">
        {/* Daily sales bar chart */}
        <div className="dash-chart-card dash-chart-wide">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Ventas por Día</h3>
          {dailyData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D2D44" vertical={false} />
                  <XAxis dataKey="label" stroke="#6B6B80" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B6B80" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [formatCurrency(v, currency), 'Total']} />
                  <Bar dataKey="total" fill="#6C5CE7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin datos para el rango seleccionado</div>
          )}
        </div>

        {/* Comprobante type pie */}
        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Por Tipo de Comprobante</h3>
          {comprobanteData.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={comprobanteData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="total">
                      {comprobanteData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => formatCurrency(v, currency)} />
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

      {/* Payment methods + Top products */}
      <div className="dash-charts-row">
        {/* Payment methods horizontal bar */}
        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Métodos de Pago</h3>
          {paymentData.length > 0 ? (
            <div className="table-container" style={{ background: 'transparent' }}>
              <table>
                <thead>
                  <tr>
                    <th>Método</th>
                    <th style={{ textAlign: 'right' }}>Ventas</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
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
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="text-accent">{formatCurrency(p.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Sin datos</div>
          )}
        </div>

        {/* Top products */}
        <div className="dash-chart-card">
          <h3 className="section-title" style={{ margin: '0 0 0.5rem' }}>Top 10 Productos</h3>
          {topProducts.length > 0 ? (
            <div className="table-container" style={{ background: 'transparent' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ textAlign: 'right' }}>{p.qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="text-accent">{formatCurrency(p.revenue, currency)}</td>
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

      {/* Sales detail table */}
      {filteredSales.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 className="section-title">Detalle de Ventas ({filteredSales.length})</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Comprobante</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td><span className="invoice-badge">{s.invoiceNumber || s.numeroVenta}</span></td>
                    <td><span className={`tipo-badge tipo-${(s.tipoComprobante || 'boleta').toLowerCase()}`}>{getTipoComprobanteLabel(s.tipoComprobante || 'BOLETA')}</span></td>
                    <td>{s.customer?.name || s.customer?.nombre || s.clienteNombre || 'Cliente General'}</td>
                    <td>{(s.items || s.detalles || []).reduce((a, i) => a + (i.quantity || i.cantidad || 0), 0)}</td>
                    <td className="text-accent">{formatCurrency(s.total, currency)}</td>
                    <td><span className="method-badge">{getPaymentMethodLabel(s.paymentMethod || s.metodoPago)}</span></td>
                    <td className="text-muted">{formatShortDate(s.date || s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
