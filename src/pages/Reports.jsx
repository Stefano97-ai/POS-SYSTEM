import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getPaymentMethodLabel, getTipoComprobanteLabel, calculateIGV, calculateSubtotalSinIGV } from '../utils/helpers';
import StatsCard from '../components/StatsCard';
import ReportsFilters from '../components/reports/ReportsFilters';
import ReportsCharts from '../components/reports/ReportsCharts';
import SalesDetailTable from '../components/reports/SalesDetailTable';
import { exportarExcelCompleto } from '../utils/exportExcel';
import { DollarSign, TrendingUp, BarChart3, Award, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function Reports() {
  const { state } = useApp();
  const { sales, settings } = state;
  const currency = settings.currency || 'S/.';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const { toast, showToast } = useToast();

  const setRange = (days) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 86400000);
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
  };

  const filteredSales = useMemo(() => sales.filter((s) => {
    const d = new Date(s.date || s.createdAt).toISOString().split('T')[0];
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  }), [sales, dateFrom, dateTo]);

  const summary = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalIGV = filteredSales.reduce((sum, s) => sum + (s.tax || s.igv || calculateIGV(s.total || 0)), 0);
    const totalSubtotal = filteredSales.reduce((sum, s) => sum + (s.subtotal || calculateSubtotalSinIGV(s.total || 0)), 0);
    const avgSale = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    return { totalRevenue, totalIGV, totalSubtotal, avgSale, count: filteredSales.length };
  }, [filteredSales]);

  const dailyData = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const d = new Date(s.date || s.createdAt).toISOString().split('T')[0];
      if (!map[d]) map[d] = { date: d, total: 0, count: 0 };
      map[d].total += s.total || 0;
      map[d].count += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      ...d, label: new Date(d.date + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
    }));
  }, [filteredSales]);

  const paymentData = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const m = s.paymentMethod || s.metodoPago || 'EFECTIVO';
      if (!map[m]) map[m] = { count: 0, total: 0 };
      map[m].count += 1;
      map[m].total += s.total || 0;
    });
    return Object.entries(map).map(([method, data]) => ({ name: getPaymentMethodLabel(method), ...data }));
  }, [filteredSales]);

  const comprobanteData = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const t = s.tipoComprobante || 'BOLETA';
      if (!map[t]) map[t] = { count: 0, total: 0 };
      map[t].count += 1;
      map[t].total += s.total || 0;
    });
    return Object.entries(map).map(([tipo, data]) => ({ name: getTipoComprobanteLabel(tipo), ...data }));
  }, [filteredSales]);

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
    return Object.entries(counts).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredSales]);

  const handleExport = () => {
    setDownloading(true);
    try {
      const { products, customers } = state;
      exportarExcelCompleto({
        ventas: filteredSales,
        productos: products,
        clientes: customers,
        fechaDesde: dateFrom,
        fechaHasta: dateTo,
      });
      showToast('✅ Excel generado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      showToast('Error al exportar: ' + error.message, 'error');
    }
    setDownloading(false);
  };

  return (
    <div className="data-page-premium">
      <div className="page-header-premium">
        <div className="title-area">
          <h1>Reportes de Ventas</h1>
          <p>Análisis detallado con gráficos y exportación</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={handleExport} disabled={downloading}>
          <Download size={18} /> {downloading ? 'Exportando...' : 'Exportar Excel'}
        </button>
      </div>

      <ReportsFilters dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} onSetRange={setRange} />

      <div className="stats-grid">
        <StatsCard icon={DollarSign} title="Ingresos Totales" value={formatCurrency(summary.totalRevenue, currency)} subtitle={`IGV: ${formatCurrency(summary.totalIGV, currency)}`} color="success" />
        <StatsCard icon={BarChart3} title="Ventas" value={summary.count} subtitle={`Op. Gravada: ${formatCurrency(summary.totalSubtotal, currency)}`} color="primary" />
        <StatsCard icon={TrendingUp} title="Promedio x Venta" value={formatCurrency(summary.avgSale, currency)} color="info" />
        <StatsCard icon={Award} title="Más Vendido" value={topProducts[0]?.name || 'N/A'} subtitle={topProducts[0] ? `${topProducts[0].qty} uds` : ''} color="warning" />
      </div>

      <ReportsCharts dailyData={dailyData} comprobanteData={comprobanteData} paymentData={paymentData} topProducts={topProducts} currency={currency} />

      <SalesDetailTable sales={filteredSales} currency={currency} />

      {toast && (
        <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
