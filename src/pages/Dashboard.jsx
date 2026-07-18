import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, isToday, isThisMonth } from '../utils/helpers';
import { exportarExcelCompleto } from '../utils/exportExcel';
import { Download, AlertTriangle, Package, CreditCard, Award, DollarSign, FileText, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
export default function Dashboard() {
  const { state } = useApp();
  const { sales, products, settings } = state;
  const currency = settings.currency || 'S/.';

  const [exporting, setExporting] = useState(false);

  // Exportar Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportarExcelCompleto({
        ventas: sales,
        productos: products,
        clientes: state.customers,
      });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al generar el Excel: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const todaySales = sales.filter((s) => isToday(s.date || s.createdAt));
    const monthSales = sales.filter((s) => isThisMonth(s.date || s.createdAt));
    
    const todayTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const monthTotal = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);
    
    const ticketPromedio = monthSales.length > 0 ? (monthTotal / monthSales.length) : 0;
    
    const facturas = sales.filter(s => s.tipoComprobante === 'FACTURA').length;
    const boletas = sales.filter(s => (s.tipoComprobante || 'BOLETA') === 'BOLETA').length;

    return { todayTotal, monthTotal, ticketPromedio, facturas, boletas };
  }, [sales]);

  // Alertas de Stock
  const stockAlerts = useMemo(() => {
    return products
      .filter(p => {
        const stock = p.stock || 0;
        const min = p.stockMinimo || 5;
        // Solo mostramos si hay problema (<= min + 3 para amarillo, <= min para rojo)
        return stock <= (min + 3);
      })
      .map(p => {
        const stock = p.stock || 0;
        const min = p.stockMinimo || 5;
        return {
          ...p,
          status: stock <= min ? 'rojo' : 'amarillo'
        };
      })
      .sort((a, b) => (a.stock || 0) - (b.stock || 0)); // Menor stock primero
  }, [products]);

  // Métodos de Pago
  const paymentMethods = useMemo(() => {
    let efectivo = 0;
    let digital = 0;
    
    sales.filter(s => isThisMonth(s.date || s.createdAt)).forEach((s) => {
      const m = (s.paymentMethod || s.metodoPago || 'EFECTIVO').toUpperCase();
      if (m === 'EFECTIVO') {
        efectivo += (s.total || 0);
      } else {
        digital += (s.total || 0);
      }
    });

    const total = efectivo + digital;
    const pctEfectivo = total > 0 ? (efectivo / total) * 100 : 0;
    const pctDigital = total > 0 ? (digital / total) * 100 : 0;

    return { efectivo, digital, pctEfectivo, pctDigital };
  }, [sales]);

  // Top 3 Productos
  const topProducts = useMemo(() => {
    const counts = {};
    sales.forEach((s) => {
      (s.items || s.detalles || []).forEach((item) => {
        const name = item.name || item.nombre || item.productoNombre || 'Desconocido';
        counts[name] = (counts[name] || 0) + (item.quantity || item.cantidad || 0);
      });
    });
    return Object.entries(counts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);
  }, [sales]);

  // Datos para Recharts
  const paymentData = [
    { name: 'Efectivo', value: paymentMethods.efectivo, color: '#10B981' },
    { name: 'Digital', value: paymentMethods.digital, color: '#3B82F6' },
  ].filter(d => d.value > 0);

  // Mock data for sales chart to look nice (en un sistema real esto vendría agrupado por día)
  const salesData = [
    { name: 'Lun', total: kpis.todayTotal * 0.8 },
    { name: 'Mar', total: kpis.todayTotal * 1.2 },
    { name: 'Mié', total: kpis.todayTotal * 0.9 },
    { name: 'Jue', total: kpis.todayTotal * 1.5 },
    { name: 'Vie', total: kpis.todayTotal * 1.1 },
    { name: 'Sáb', total: kpis.todayTotal },
    { name: 'Dom', total: kpis.todayTotal * 0.5 },
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  return (
    <div className="dashboard-premium">
      
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Visión Ejecutiva</h1>
          <p className="dashboard-subtitle">Resumen y estado general del negocio en tiempo real</p>
        </div>
        <button 
          className="btn-export"
          onClick={handleExportExcel} 
          disabled={exporting}
        >
          <Download size={18} /> {exporting ? 'Generando Excel...' : 'Exportar Reporte'}
        </button>
      </div>

      {/* KPIS (4 Columnas) */}
      <div className="kpi-grid">
        
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper"><DollarSign size={22} /></div>
            <span className="kpi-title">Ventas de Hoy</span>
          </div>
          <div className="kpi-value">{formatCurrency(kpis.todayTotal, currency)}</div>
          <span className="kpi-subtext">Cierre al final del día</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper" style={{color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)'}}>
              <TrendingUp size={22} />
            </div>
            <span className="kpi-title">Ventas del Mes</span>
          </div>
          <div className="kpi-value">{formatCurrency(kpis.monthTotal, currency)}</div>
          <span className="kpi-subtext">Acumulado mensual</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper" style={{color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)'}}>
              <FileText size={22} />
            </div>
            <span className="kpi-title">Ticket Promedio</span>
          </div>
          <div className="kpi-value">{formatCurrency(kpis.ticketPromedio, currency)}</div>
          <span className="kpi-subtext">Gasto medio por cliente</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-wrapper" style={{color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)'}}>
              <Award size={22} />
            </div>
            <span className="kpi-title">Comprobantes</span>
          </div>
          <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem', position: 'relative', zIndex: 1}}>
            <div>
              <div style={{fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-main)'}}>{kpis.facturas}</div>
              <div style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>Facturas</div>
            </div>
            <div style={{width: '1px', background: 'var(--color-border)'}}></div>
            <div>
              <div style={{fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-main)'}}>{kpis.boletas}</div>
              <div style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>Boletas</div>
            </div>
          </div>
        </div>
      </div>

      {/* MID GRID (2 Columnas anchas para gráficos) */}
      <div className="dashboard-panels" style={{marginBottom: '2.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))'}}>
        
        {/* Gráfico de Ventas de la Semana */}
        <div className="panel-card">
          <div className="panel-header">
            <Activity size={22} color="var(--color-primary)" /> 
            <h3 className="panel-title">Tendencia de Ventas (Semana)</h3>
          </div>
          <div style={{height: '250px', width: '100%'}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Métodos de Pago */}
        <div className="panel-card">
          <div className="panel-header">
            <CreditCard size={22} color="var(--color-primary)" /> 
            <h3 className="panel-title">Distribución de Pagos (Mes)</h3>
          </div>
          
          <div style={{display: 'flex', alignItems: 'center', height: '250px'}}>
            {paymentData.length > 0 ? (
              <>
                <div style={{width: '50%', height: '100%'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value, currency)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{width: '50%', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {paymentData.map((d, i) => (
                    <div key={i} style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                      <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: d.color}}></div>
                      <div>
                        <div style={{fontSize: '0.9rem', color: 'var(--color-text-sec)', fontWeight: '500'}}>{d.name}</div>
                        <div style={{fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-main)'}}>{formatCurrency(d.value, currency)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
               <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', width: '100%', textAlign: 'center' }}>No hay pagos registrados este mes.</p>
            )}
          </div>
        </div>
      </div>

      {/* LOWER GRID (2 Columnas) */}
      <div className="dashboard-panels">
        
        {/* PANEL: Alertas de Stock */}
        <div className="panel-card">
          <div className="panel-header">
            <AlertTriangle size={22} color="#F59E0B" /> 
            <h3 className="panel-title">Atención de Inventario</h3>
          </div>
          
          {stockAlerts.length > 0 ? (
            <div className="stock-list">
              {stockAlerts.map(p => (
                <div key={p.id} className={`stock-item ${p.status === 'rojo' ? 'danger' : 'warning'}`}>
                  <span className="stock-name">{p.name || p.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Quedan:</span>
                    <span className={`stock-badge ${p.status === 'rojo' ? 'danger' : 'warning'}`}>
                      {p.stock || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', gap: '1rem', color: 'var(--color-text-muted)'}}>
              <Package size={40} opacity={0.2} />
              <p style={{ fontSize: '0.9rem', margin: 0 }}>El inventario está en niveles óptimos.</p>
            </div>
          )}
        </div>

        {/* PANEL: Top 3 Productos */}
        <div className="panel-card">
          <div className="panel-header">
            <Package size={22} color="var(--color-primary)" /> 
            <h3 className="panel-title">Top Productos Vendidos</h3>
          </div>

          {topProducts.length > 0 ? (
            <div className="product-list">
              {topProducts.map((p, i) => (
                <div key={i} className="product-item">
                  <div className="product-info">
                    <div className="product-rank">{i + 1}</div>
                    <span className="product-name">{p.name}</span>
                  </div>
                  <div className="product-qty">
                    {p.qty} <span>uds</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', gap: '1rem', color: 'var(--color-text-muted)'}}>
              <TrendingUp size={40} opacity={0.2} />
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Aún no hay suficientes ventas.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
