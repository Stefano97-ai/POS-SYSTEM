import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { calculateIGV } from '../utils/helpers';
import Modal from '../components/Modal';
import InvoicePreview from '../components/InvoicePreview';
import BillingFilters from '../components/billing/BillingFilters';
import BillingTable from '../components/billing/BillingTable';
import NotaCreditoModal from '../components/billing/NotaCreditoModal';
import ResumenDiarioModal from '../components/billing/ResumenDiarioModal';
import ComunicacionBajaModal from '../components/billing/ComunicacionBajaModal';
import { Send, Ban, FileText, FileDown, FileCode2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Billing() {
  const { state, dispatch } = useApp();
  const { sales, settings } = state;
  const currency = settings.currency || 'S/.';

  // Filters
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [selectedSale, setSelectedSale] = useState(null);
  const [showNotaCredito, setShowNotaCredito] = useState(null);
  const [showResumenDiario, setShowResumenDiario] = useState(false);
  const [showComunicacionBaja, setShowComunicacionBaja] = useState(false);

  // UI
  const [downloading, setDownloading] = useState(null);
  const [processing, setProcessing] = useState(false);
  const comprobanteRef = useRef();  // Para imprimir desde el modal
  const pdfRef = useRef();          // Para PDF desde la tabla (elemento oculto)
  const [pdfSale, setPdfSale] = useState(null); // Venta que se renderiza en pdfRef
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { toast, showToast } = useToast();

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const q = search.toLowerCase();
      const numero = (s.invoiceNumber || s.numeroVenta || s.numeroComprobante || '').toLowerCase();
      const cliente = (s.customer?.name || s.customer?.nombre || s.clienteNombre || '').toLowerCase();
      const matchSearch = !q || numero.includes(q) || cliente.includes(q);
      const matchTipo = !tipoFilter || (s.tipoComprobante || 'BOLETA') === tipoFilter;
      const matchEstado = !estadoFilter || (s.estadoSunat || s.estado || 'PENDIENTE') === estadoFilter;
      const saleDate = new Date(s.date || s.fechaEmision || s.createdAt);
      const matchDesde = !fechaDesde || saleDate >= new Date(fechaDesde);
      const matchHasta = !fechaHasta || saleDate <= new Date(fechaHasta + 'T23:59:59');
      return matchSearch && matchTipo && matchEstado && matchDesde && matchHasta;
    });
  }, [sales, search, tipoFilter, estadoFilter, fechaDesde, fechaHasta]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, s) => sum + (s.total || 0), 0);
    const igvTotal = filtered.reduce((sum, s) => sum + (s.tax || s.igv || calculateIGV(s.total || 0)), 0);
    const pendientes = filtered.filter((s) => (s.estadoSunat || s.estado || 'PENDIENTE') === 'PENDIENTE').length;
    const aceptados = filtered.filter((s) => (s.estadoSunat || s.estado || 'PENDIENTE') === 'ACEPTADO').length;
    return { total, igvTotal, pendientes, aceptados, count: filtered.length };
  }, [filtered]);

  const todayStr = new Date().toDateString();
  const boletasHoy = sales.filter((s) => (s.tipoComprobante || 'BOLETA') === 'BOLETA' && new Date(s.date || s.fechaEmision || s.createdAt).toDateString() === todayStr).length;
  const notasHoy = sales.filter((s) => ['NOTA_CREDITO', 'NOTA_DEBITO'].includes(s.tipoComprobante) && new Date(s.date || s.fechaEmision || s.createdAt).toDateString() === todayStr).length;

  // Print and PDF Logic utilizing isolated rendering
  const handlePrint = useReactToPrint({
    contentRef: comprobanteRef,
    documentTitle: selectedSale ? `Comprobante_${selectedSale.invoiceNumber || 'Factura'}` : 'Comprobante',
  });

  const handleDownloadPdf = async (sale) => {
    if (!sale) return;
    try {
      setGeneratingPdf(true);
      // Mostrar la venta en el elemento oculto
      setPdfSale(sale);
      // Esperar a que React renderice el elemento oculto
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const element = pdfRef.current;
      if (!element) throw new Error('No se pudo generar el PDF');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        windowHeight: element.scrollHeight,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${sale.invoiceNumber || sale.numeroVenta || 'Comprobante'}.pdf`);
      showToast('✅ PDF descargado exitosamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showToast('Error al generar el PDF: ' + error.message, 'error');
    } finally {
      setGeneratingPdf(false);
      setPdfSale(null); // Limpiar el elemento oculto
    }
  };

  const handleDownloadXml = async (sale) => {
    const id = sale.comprobanteId || sale.id;
    setDownloading(`xml-${id}`);
    try {
      const blob = await api.getComprobanteXml(id);
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/xml' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sale.invoiceNumber || sale.numeroVenta || 'comprobante'}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('XML descargado');
    } catch { showToast('Error al descargar XML', 'error'); }
    setDownloading(null);
  };

  const handleReenviar = async (sale) => {
    setProcessing(true);
    try {
      const result = await api.reenviarComprobante(sale.comprobanteId || sale.id);
      dispatch({ type: 'UPDATE_SALE', payload: { id: sale.id, estadoSunat: result.estadoSunat || 'PENDIENTE' } });
      showToast(`Reenviado — ${result.estadoSunat || 'Pendiente'}`);
    } catch { showToast('Error al reenviar a SUNAT', 'error'); }
    setProcessing(false);
  };

  const handleEmitirNotaCredito = async (motivo, tipo) => {
    if (!showNotaCredito || !motivo.trim()) return;
    setProcessing(true);
    try {
      const result = await api.createNotaCredito({ ventaOrigenId: showNotaCredito.id, motivo, tipo, tipoComprobante: 'NOTA_CREDITO' });
      dispatch({ type: 'ADD_SALE', payload: { ...result, tipoComprobante: 'NOTA_CREDITO' } });
      if (tipo === 'ANULACION_TOTAL') {
        dispatch({ type: 'UPDATE_SALE', payload: { id: showNotaCredito.id, estado: 'ANULADA', estadoSunat: 'ANULADO' } });
      }
      setShowNotaCredito(null);
      showToast('Nota de Crédito emitida exitosamente');
    } catch { showToast('Error al emitir la Nota de Crédito', 'error'); }
    setProcessing(false);
  };

  const handleResumenDiario = async () => {
    setProcessing(true);
    try {
      await api.resumenDiario();
      showToast('Resumen diario enviado a SUNAT');
      setShowResumenDiario(false);
    } catch { showToast('Error al enviar resumen diario', 'error'); }
    setProcessing(false);
  };

  const handleComunicacionBaja = async (comprobantes, motivo) => {
    setProcessing(true);
    try {
      await api.comunicacionBaja({ comprobantes, motivo });
      showToast('Comunicación de baja enviada a SUNAT');
      setShowComunicacionBaja(false);
    } catch { showToast('Error al enviar comunicación de baja', 'error'); }
    setProcessing(false);
  };

  const clearFilters = () => { setSearch(''); setTipoFilter(''); setEstadoFilter(''); setFechaDesde(''); setFechaHasta(''); };

  return (
    <div className="data-page-premium">
      <div className="page-header-premium">
        <div className="title-area">
          <h1>Facturación Electrónica</h1>
          <p>{sales.length} comprobantes emitidos</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" style={{ borderRadius: '0.75rem' }} onClick={() => setShowResumenDiario(true)}><Send size={16} /> Resumen Diario</button>
          <button className="btn btn-ghost" style={{ borderRadius: '0.75rem' }} onClick={() => setShowComunicacionBaja(true)}><Ban size={16} /> Com. de Baja</button>
        </div>
      </div>

      <div className="billing-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Facturado', value: `S/ ${stats.total.toFixed(2)}`, accent: true },
          { label: 'IGV Total', value: `S/ ${stats.igvTotal.toFixed(2)}` },
          { label: 'Comprobantes', value: stats.count },
          { label: 'Pendientes SUNAT', value: stats.pendientes, warn: stats.pendientes > 0 },
          { label: 'Aceptados', value: stats.aceptados, success: true },
        ].map(({ label, value, accent, warn, success }) => (
          <div key={label} style={{ background: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span className={accent ? 'cell-currency' : ''} style={{ fontSize: '1.5rem', fontWeight: 700, color: accent ? 'var(--color-primary)' : warn ? '#D97706' : success ? '#10B981' : 'var(--color-text-main)', lineHeight: 1 }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="data-card-premium">
        <BillingFilters
        search={search} onSearch={setSearch}
        showFilters={showFilters} onToggleFilters={() => setShowFilters(!showFilters)}
        tipoFilter={tipoFilter} onTipoFilter={setTipoFilter}
        estadoFilter={estadoFilter} onEstadoFilter={setEstadoFilter}
        fechaDesde={fechaDesde} onFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta} onFechaHasta={setFechaHasta}
        onClear={clearFilters}
      />

      {filtered.length > 0 ? (
        <BillingTable
          sales={filtered}
          currency={currency}
          onViewSale={setSelectedSale}
          onDownloadPdf={handleDownloadPdf}
          onDownloadXml={handleDownloadXml}
          onReenviar={handleReenviar}
          onNotaCredito={setShowNotaCredito}
          downloading={downloading}
          processing={processing}
        />
      ) : (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <FileText size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>No hay comprobantes</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{sales.length === 0 ? 'Los comprobantes se generan automáticamente al completar una venta en el POS' : 'No se encontraron resultados con los filtros aplicados'}</p>
        </div>
      )}
      </div>

      <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title="Detalle del Comprobante" size="full">
        {selectedSale && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div ref={comprobanteRef} style={{ width: '100%', maxWidth: '800px', background: 'white', padding: '20px' }}>
                <InvoicePreview sale={selectedSale} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }} className="no-print">
              <button className="btn btn-ghost btn-sm" onClick={() => handlePrint()}>Imprimir Comprobante</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf(selectedSale)} disabled={generatingPdf}>
                <FileDown size={14} /> {generatingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadXml(selectedSale)}><FileCode2 size={14} /> XML</button>
            </div>
          </div>
        )}
      </Modal>

      <NotaCreditoModal sale={showNotaCredito} onClose={() => setShowNotaCredito(null)} onSubmit={handleEmitirNotaCredito} processing={processing} currency={currency} />
      <ResumenDiarioModal isOpen={showResumenDiario} onClose={() => setShowResumenDiario(false)} onSubmit={handleResumenDiario} processing={processing} boletasHoy={boletasHoy} notasHoy={notasHoy} />
      <ComunicacionBajaModal isOpen={showComunicacionBaja} onClose={() => setShowComunicacionBaja(false)} onSubmit={handleComunicacionBaja} processing={processing} sales={sales} currency={currency} />

      {/* Contenedor OCULTO para generar PDF sin abrir modal */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '800px', background: 'white', zIndex: -1 }}
           aria-hidden="true">
        <div ref={pdfRef} style={{ padding: '20px' }}>
          {pdfSale && <InvoicePreview sale={pdfSale} />}
        </div>
      </div>

      {toast && (
        <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
