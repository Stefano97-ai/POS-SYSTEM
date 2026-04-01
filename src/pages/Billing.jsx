import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  getPaymentMethodLabel,
  getTipoComprobanteLabel,
  calculateSubtotalSinIGV,
  calculateIGV,
} from '../utils/helpers';
import Modal from '../components/Modal';
import InvoicePreview from '../components/InvoicePreview';
import {
  Search,
  FileText,
  Eye,
  FileCode2,
  RefreshCw,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Send,
  FileDown,
  RotateCcw,
} from 'lucide-react';

const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', color: 'warning', icon: Clock },
  ACEPTADO: { label: 'Aceptado', color: 'success', icon: CheckCircle2 },
  RECHAZADO: { label: 'Rechazado', color: 'danger', icon: XCircle },
  ANULADO: { label: 'Anulado', color: 'muted', icon: Ban },
};

const TIPO_FILTER_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'BOLETA', label: 'Boleta' },
  { value: 'FACTURA', label: 'Factura' },
  { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
  { value: 'NOTA_DEBITO', label: 'Nota de Débito' },
  { value: 'NOTA_VENTA', label: 'Nota de Venta' },
];

const ESTADO_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'ANULADO', label: 'Anulado' },
];

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
  const [expandedRow, setExpandedRow] = useState(null);
  const [showNotaCredito, setShowNotaCredito] = useState(null);
  const [notaCreditoMotivo, setNotaCreditoMotivo] = useState('');
  const [notaCreditoTipo, setNotaCreditoTipo] = useState('ANULACION_TOTAL');
  const [showResumenDiario, setShowResumenDiario] = useState(false);
  const [showComunicacionBaja, setShowComunicacionBaja] = useState(false);
  const [bajaMotivo, setBajaMotivo] = useState('');
  const [bajaComprobantes, setBajaComprobantes] = useState([]);

  // Loading states
  const [downloading, setDownloading] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filtered sales
  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const q = search.toLowerCase();
      const numero = (s.invoiceNumber || s.numeroVenta || s.numeroComprobante || '').toLowerCase();
      const cliente = (s.customer?.name || s.customer?.nombre || s.clienteNombre || '').toLowerCase();
      const matchSearch = !q || numero.includes(q) || cliente.includes(q);

      const tipo = s.tipoComprobante || 'BOLETA';
      const matchTipo = !tipoFilter || tipo === tipoFilter;

      const estado = s.estadoSunat || s.estado || 'PENDIENTE';
      const matchEstado = !estadoFilter || estado === estadoFilter;

      const saleDate = new Date(s.date || s.fechaEmision || s.createdAt);
      const matchDesde = !fechaDesde || saleDate >= new Date(fechaDesde);
      const matchHasta = !fechaHasta || saleDate <= new Date(fechaHasta + 'T23:59:59');

      return matchSearch && matchTipo && matchEstado && matchDesde && matchHasta;
    });
  }, [sales, search, tipoFilter, estadoFilter, fechaDesde, fechaHasta]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filtered.reduce((sum, s) => sum + (s.total || 0), 0);
    const igvTotal = filtered.reduce((sum, s) => sum + (s.tax || s.igv || calculateIGV(s.total || 0)), 0);
    const byTipo = {};
    filtered.forEach((s) => {
      const tipo = s.tipoComprobante || 'BOLETA';
      byTipo[tipo] = (byTipo[tipo] || 0) + 1;
    });
    const pendientes = filtered.filter((s) => (s.estadoSunat || s.estado || 'PENDIENTE') === 'PENDIENTE').length;
    const aceptados = filtered.filter((s) => (s.estadoSunat || s.estado || 'PENDIENTE') === 'ACEPTADO').length;
    return { total, igvTotal, byTipo, pendientes, aceptados, count: filtered.length };
  }, [filtered]);

  // Handlers
  const handleDownloadPdf = async (sale) => {
    const id = sale.comprobanteId || sale.id;
    setDownloading(`pdf-${id}`);
    try {
      const blob = await api.getComprobantePdf(id);
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sale.invoiceNumber || sale.numeroVenta || 'comprobante'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('PDF descargado');
    } catch {
      showToast('Error al descargar PDF', 'error');
    }
    setDownloading(null);
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
    } catch {
      showToast('Error al descargar XML', 'error');
    }
    setDownloading(null);
  };

  const handleReenviarSunat = async (sale) => {
    const id = sale.comprobanteId || sale.id;
    setProcessing(true);
    try {
      const result = await api.reenviarComprobante(id);
      dispatch({ type: 'UPDATE_SALE', payload: { id: sale.id, estadoSunat: result.estadoSunat || 'PENDIENTE' } });
      showToast(`Comprobante reenviado — ${result.estadoSunat || 'Pendiente'}`);
    } catch {
      showToast('Error al reenviar a SUNAT', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEmitirNotaCredito = async () => {
    if (!showNotaCredito || !notaCreditoMotivo.trim()) return;
    setProcessing(true);
    try {
      const data = {
        ventaOrigenId: showNotaCredito.id,
        motivo: notaCreditoMotivo,
        tipo: notaCreditoTipo,
        tipoComprobante: 'NOTA_CREDITO',
      };
      const result = await api.createNotaCredito(data);

      // Agregar la NC a las ventas y marcar la original como anulada si es anulación total
      dispatch({ type: 'ADD_SALE', payload: { ...result, tipoComprobante: 'NOTA_CREDITO' } });
      if (notaCreditoTipo === 'ANULACION_TOTAL') {
        dispatch({ type: 'UPDATE_SALE', payload: { id: showNotaCredito.id, estado: 'ANULADA', estadoSunat: 'ANULADO' } });
      }

      setShowNotaCredito(null);
      setNotaCreditoMotivo('');
      setNotaCreditoTipo('ANULACION_TOTAL');
      showToast('Nota de Crédito emitida exitosamente');
    } catch {
      showToast('Error al emitir la Nota de Crédito', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleResumenDiario = async () => {
    setProcessing(true);
    try {
      await api.resumenDiario();
      showToast('Resumen diario enviado a SUNAT');
      setShowResumenDiario(false);
    } catch {
      showToast('Error al enviar resumen diario', 'error');
    }
    setProcessing(false);
  };

  const handleComunicacionBaja = async () => {
    if (bajaComprobantes.length === 0 || !bajaMotivo.trim()) return;
    setProcessing(true);
    try {
      await api.comunicacionBaja({ comprobantes: bajaComprobantes, motivo: bajaMotivo });
      showToast('Comunicación de baja enviada a SUNAT');
      setShowComunicacionBaja(false);
      setBajaMotivo('');
      setBajaComprobantes([]);
    } catch {
      showToast('Error al enviar comunicación de baja', 'error');
    }
    setProcessing(false);
  };

  const toggleBajaComprobante = (id) => {
    setBajaComprobantes((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handlePrint = () => window.print();

  const getEstadoBadge = (sale) => {
    const estado = sale.estadoSunat || sale.estado || 'PENDIENTE';
    const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDIENTE;
    const Icon = config.icon;
    return (
      <span className={`estado-badge estado-${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const clearFilters = () => {
    setSearch('');
    setTipoFilter('');
    setEstadoFilter('');
    setFechaDesde('');
    setFechaHasta('');
  };

  const hasActiveFilters = tipoFilter || estadoFilter || fechaDesde || fechaHasta;

  return (
    <div className="billing-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Facturación Electrónica</h1>
          <p className="page-subtitle">{sales.length} comprobantes emitidos</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => setShowResumenDiario(true)}>
            <Send size={16} /> Resumen Diario
          </button>
          <button className="btn btn-ghost" onClick={() => setShowComunicacionBaja(true)}>
            <Ban size={16} /> Com. de Baja
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="billing-stats">
        <div className="billing-stat-card">
          <span className="billing-stat-label">Total Facturado</span>
          <span className="billing-stat-value text-accent">{formatCurrency(stats.total, currency)}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">IGV Total</span>
          <span className="billing-stat-value">{formatCurrency(stats.igvTotal, currency)}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Comprobantes</span>
          <span className="billing-stat-value">{stats.count}</span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Pendientes SUNAT</span>
          <span className="billing-stat-value" style={{ color: stats.pendientes > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {stats.pendientes}
          </span>
        </div>
        <div className="billing-stat-card">
          <span className="billing-stat-label">Aceptados</span>
          <span className="billing-stat-value" style={{ color: 'var(--color-success)' }}>{stats.aceptados}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="products-toolbar">
        <div className="toolbar-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por N° comprobante o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filtros
          {hasActiveFilters && <span className="filter-count">{[tipoFilter, estadoFilter, fechaDesde, fechaHasta].filter(Boolean).length}</span>}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="billing-filters">
          <div className="billing-filter-group">
            <label>Tipo de comprobante</label>
            <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)}>
              {TIPO_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="billing-filter-group">
            <label>Estado SUNAT</label>
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
              {ESTADO_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="billing-filter-group">
            <label>Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </div>
          <div className="billing-filter-group">
            <label>Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>
              <RotateCcw size={14} /> Limpiar
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>N° Comprobante</th>
                <th>Tipo</th>
                <th>Estado SUNAT</th>
                <th>Cliente</th>
                <th>Subtotal</th>
                <th>IGV</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => {
                const isExpanded = expandedRow === sale.id;
                const items = sale.items || sale.detalles || [];
                const tipoComprobante = sale.tipoComprobante || 'BOLETA';
                const estado = sale.estadoSunat || sale.estado || 'PENDIENTE';
                const canEmitNC = tipoComprobante !== 'NOTA_CREDITO' && tipoComprobante !== 'NOTA_DEBITO' && estado !== 'ANULADO';

                return (
                  <>
                    <tr key={sale.id} className={isExpanded ? 'row-expanded' : ''}>
                      <td>
                        <button
                          className="btn-expand"
                          onClick={() => setExpandedRow(isExpanded ? null : sale.id)}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td><span className="invoice-badge">{sale.invoiceNumber || sale.numeroVenta || sale.numeroComprobante}</span></td>
                      <td>
                        <span className={`tipo-badge tipo-${tipoComprobante.toLowerCase()}`}>
                          {getTipoComprobanteLabel(tipoComprobante)}
                        </span>
                      </td>
                      <td>{getEstadoBadge(sale)}</td>
                      <td>{sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'}</td>
                      <td>{formatCurrency(sale.subtotal || calculateSubtotalSinIGV(sale.total || 0), currency)}</td>
                      <td className="text-muted">{formatCurrency(sale.tax || sale.igv || calculateIGV(sale.total || 0), currency)}</td>
                      <td className="text-accent">{formatCurrency(sale.total, currency)}</td>
                      <td>
                        <span className={`method-badge ${(sale.paymentMethod || sale.metodoPago || '').toLowerCase()}`}>
                          {getPaymentMethodLabel(sale.paymentMethod || sale.metodoPago)}
                        </span>
                      </td>
                      <td className="text-muted">{formatShortDate(sale.date || sale.fechaEmision || sale.createdAt)}</td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedSale(sale)}
                            title="Ver comprobante"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDownloadPdf(sale)}
                            title="Descargar PDF"
                          >
                            <FileDown size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDownloadXml(sale)}
                            title="Descargar XML"
                          >
                            <FileCode2 size={14} />
                          </button>
                          {estado === 'PENDIENTE' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleReenviarSunat(sale)}
                              disabled={processing}
                              title="Reenviar a SUNAT"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${sale.id}-detail`} className="expanded-detail-row">
                        <td colSpan={11}>
                          <div className="expanded-detail">
                            <div className="expanded-detail-grid">
                              {/* Items list */}
                              <div className="expanded-section">
                                <h4>Detalle de productos</h4>
                                <table className="detail-table">
                                  <thead>
                                    <tr>
                                      <th>Producto</th>
                                      <th>Cant.</th>
                                      <th>P. Unit.</th>
                                      <th>Desc.</th>
                                      <th>Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item, idx) => {
                                      const qty = item.quantity || item.cantidad || 0;
                                      const price = item.price || item.precioUnitario || 0;
                                      const disc = item.discount || item.descuento || 0;
                                      const lineTotal = price * qty * (1 - disc / 100);
                                      return (
                                        <tr key={idx}>
                                          <td>{item.name || item.productName || item.productoNombre}</td>
                                          <td>{qty}</td>
                                          <td>{formatCurrency(price, currency)}</td>
                                          <td>{disc > 0 ? `${disc}%` : '-'}</td>
                                          <td>{formatCurrency(lineTotal, currency)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Info */}
                              <div className="expanded-section">
                                <h4>Información del comprobante</h4>
                                <div className="expanded-info-list">
                                  <div className="expanded-info-row">
                                    <span>Serie-Correlativo:</span>
                                    <strong>{sale.invoiceNumber || sale.numeroVenta || sale.serie || '-'}</strong>
                                  </div>
                                  <div className="expanded-info-row">
                                    <span>Fecha emisión:</span>
                                    <span>{formatDate(sale.date || sale.fechaEmision || sale.createdAt)}</span>
                                  </div>
                                  <div className="expanded-info-row">
                                    <span>Cliente:</span>
                                    <span>{sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'}</span>
                                  </div>
                                  {sale.customer?.numeroDocumento && (
                                    <div className="expanded-info-row">
                                      <span>{sale.customer?.tipoDocumento || 'Doc'}:</span>
                                      <span>{sale.customer.numeroDocumento}</span>
                                    </div>
                                  )}
                                  <div className="expanded-info-row">
                                    <span>Método de pago:</span>
                                    <span>{getPaymentMethodLabel(sale.paymentMethod || sale.metodoPago)}</span>
                                  </div>
                                  {sale.descuento > 0 && (
                                    <div className="expanded-info-row">
                                      <span>Descuento global:</span>
                                      <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(sale.descuento, currency)}</span>
                                    </div>
                                  )}
                                  <div className="expanded-info-row">
                                    <span>Op. Gravada:</span>
                                    <span>{formatCurrency(sale.subtotal || calculateSubtotalSinIGV(sale.total || 0), currency)}</span>
                                  </div>
                                  <div className="expanded-info-row">
                                    <span>IGV (18%):</span>
                                    <span>{formatCurrency(sale.tax || sale.igv || calculateIGV(sale.total || 0), currency)}</span>
                                  </div>
                                  <div className="expanded-info-row" style={{ fontWeight: 700 }}>
                                    <span>Importe Total:</span>
                                    <span className="text-accent">{formatCurrency(sale.total, currency)}</span>
                                  </div>
                                </div>

                                {/* Quick actions */}
                                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                                  {canEmitNC && (
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => {
                                        setShowNotaCredito(sale);
                                        setExpandedRow(null);
                                      }}
                                    >
                                      <XCircle size={14} /> Emitir Nota Crédito
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <FileText size={48} />
          <p>No hay comprobantes</p>
          <span>
            {sales.length === 0
              ? 'Los comprobantes se generan automáticamente al completar una venta en el POS'
              : 'No se encontraron resultados con los filtros aplicados'}
          </span>
        </div>
      )}

      {/* Modal: Ver Comprobante */}
      <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title="Detalle del Comprobante" size="lg">
        {selectedSale && (
          <div>
            <InvoicePreview sale={selectedSale} onPrint={handlePrint} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf(selectedSale)}>
                <FileDown size={14} /> PDF
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadXml(selectedSale)}>
                <FileCode2 size={14} /> XML
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Nota de Crédito */}
      <Modal
        isOpen={!!showNotaCredito}
        onClose={() => { setShowNotaCredito(null); setNotaCreditoMotivo(''); }}
        title="Emitir Nota de Crédito"
      >
        {showNotaCredito && (
          <div>
            <div className="nc-ref-card">
              <div className="nc-ref-label">Comprobante de referencia</div>
              <div className="nc-ref-info">
                <span className={`tipo-badge tipo-${(showNotaCredito.tipoComprobante || 'boleta').toLowerCase()}`}>
                  {getTipoComprobanteLabel(showNotaCredito.tipoComprobante || 'BOLETA')}
                </span>
                <strong>{showNotaCredito.invoiceNumber || showNotaCredito.numeroVenta}</strong>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {formatShortDate(showNotaCredito.date || showNotaCredito.fechaEmision || showNotaCredito.createdAt)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem' }}>
                <span>{showNotaCredito.customer?.name || showNotaCredito.customer?.nombre || showNotaCredito.clienteNombre || 'Cliente General'}</span>
                <strong className="text-accent">{formatCurrency(showNotaCredito.total, currency)}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Tipo de nota de crédito</label>
              <select value={notaCreditoTipo} onChange={(e) => setNotaCreditoTipo(e.target.value)}>
                <option value="ANULACION_TOTAL">Anulación total de la operación</option>
                <option value="ANULACION_PARCIAL">Anulación parcial</option>
                <option value="DESCUENTO">Descuento por ítem</option>
                <option value="CORRECCION">Corrección por error</option>
              </select>
            </div>

            <div className="form-group">
              <label>Motivo *</label>
              <textarea
                value={notaCreditoMotivo}
                onChange={(e) => setNotaCreditoMotivo(e.target.value)}
                placeholder="Describa el motivo de la nota de crédito..."
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {notaCreditoTipo === 'ANULACION_TOTAL' && (
              <div className="nc-warning">
                <AlertTriangle size={16} />
                <span>Se generará una Nota de Crédito por el total de {formatCurrency(showNotaCredito.total, currency)}. Esta acción anulará el comprobante original.</span>
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => { setShowNotaCredito(null); setNotaCreditoMotivo(''); }}>
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleEmitirNotaCredito}
                disabled={processing || !notaCreditoMotivo.trim()}
              >
                {processing ? 'Procesando...' : 'Emitir Nota de Crédito'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Resumen Diario */}
      <Modal isOpen={showResumenDiario} onClose={() => setShowResumenDiario(false)} title="Resumen Diario">
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sec)', marginBottom: '1rem' }}>
            El Resumen Diario envía a SUNAT un consolidado de las boletas de venta y notas asociadas emitidas en el día.
            Este proceso es obligatorio para informar las boletas electrónicas.
          </p>
          <div className="nc-ref-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Boletas del día:</span>
              <strong>{sales.filter((s) => {
                const tipo = s.tipoComprobante || 'BOLETA';
                const fecha = new Date(s.date || s.fechaEmision || s.createdAt);
                const hoy = new Date();
                return tipo === 'BOLETA' && fecha.toDateString() === hoy.toDateString();
              }).length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>Notas del día:</span>
              <strong>{sales.filter((s) => {
                const tipo = s.tipoComprobante || 'BOLETA';
                const fecha = new Date(s.date || s.fechaEmision || s.createdAt);
                const hoy = new Date();
                return (tipo === 'NOTA_CREDITO' || tipo === 'NOTA_DEBITO') && fecha.toDateString() === hoy.toDateString();
              }).length}</strong>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowResumenDiario(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleResumenDiario} disabled={processing}>
              {processing ? 'Enviando...' : 'Enviar Resumen Diario'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Comunicación de Baja */}
      <Modal
        isOpen={showComunicacionBaja}
        onClose={() => { setShowComunicacionBaja(false); setBajaMotivo(''); setBajaComprobantes([]); }}
        title="Comunicación de Baja"
        size="lg"
      >
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sec)', marginBottom: '1rem' }}>
            La Comunicación de Baja permite dar de baja comprobantes que fueron emitidos con error o que no corresponden.
            Seleccione los comprobantes a dar de baja e indique el motivo.
          </p>

          <div className="form-group">
            <label>Motivo de baja *</label>
            <textarea
              value={bajaMotivo}
              onChange={(e) => setBajaMotivo(e.target.value)}
              placeholder="Ej: Error en la emisión del comprobante"
              rows={2}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label>Seleccione comprobantes ({bajaComprobantes.length} seleccionados)</label>
          </div>

          <div className="baja-list">
            {sales
              .filter((s) => {
                const estado = s.estadoSunat || s.estado || 'PENDIENTE';
                const tipo = s.tipoComprobante || 'BOLETA';
                return estado !== 'ANULADO' && tipo !== 'NOTA_CREDITO' && tipo !== 'NOTA_DEBITO';
              })
              .slice(0, 20)
              .map((sale) => (
                <label key={sale.id} className={`baja-item ${bajaComprobantes.includes(sale.id) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={bajaComprobantes.includes(sale.id)}
                    onChange={() => toggleBajaComprobante(sale.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="invoice-badge">{sale.invoiceNumber || sale.numeroVenta}</span>
                      <span className={`tipo-badge tipo-${(sale.tipoComprobante || 'boleta').toLowerCase()}`}>
                        {getTipoComprobanteLabel(sale.tipoComprobante || 'BOLETA')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'} — {formatCurrency(sale.total, currency)}
                    </div>
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {formatShortDate(sale.date || sale.fechaEmision || sale.createdAt)}
                  </span>
                </label>
              ))}
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => { setShowComunicacionBaja(false); setBajaMotivo(''); setBajaComprobantes([]); }}>
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              onClick={handleComunicacionBaja}
              disabled={processing || bajaComprobantes.length === 0 || !bajaMotivo.trim()}
            >
              {processing ? 'Enviando...' : `Dar de Baja (${bajaComprobantes.length})`}
            </button>
          </div>
        </div>
      </Modal>

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
