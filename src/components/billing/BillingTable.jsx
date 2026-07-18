import { useState } from 'react';
import { Eye, FileCode2, RefreshCw, FileDown, XCircle, ChevronDown, ChevronUp, Clock, CheckCircle2, Ban, CalendarClock } from 'lucide-react';
import { formatCurrency, formatDate, formatShortDate, getPaymentMethodLabel, getTipoComprobanteLabel, calculateSubtotalSinIGV, calculateIGV } from '../../utils/helpers';

const ESTADO_CONFIG = {
  PENDIENTE:          { label: 'Pendiente',        color: 'warning', icon: Clock },
  PENDIENTE_RESUMEN:  { label: 'Resumen Pendiente', color: 'info',    icon: CalendarClock },
  ACEPTADO:           { label: 'Aceptado',          color: 'success', icon: CheckCircle2 },
  RECHAZADO:          { label: 'Rechazado',         color: 'danger',  icon: XCircle },
  ANULADO:            { label: 'Anulado',           color: 'muted',   icon: Ban },
};


function EstadoBadge({ sale }) {
  const estado = sale.estadoSunat || sale.comprobanteEstado || sale.estado || 'PENDIENTE';
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDIENTE;
  const Icon = cfg.icon;
  return <span className={`badge-premium ${cfg.color}`}><Icon size={12} /> {cfg.label}</span>;
}

export default function BillingTable({ sales, currency, onViewSale, onDownloadPdf, onDownloadXml, onReenviar, onNotaCredito, processing }) {
  const [expandedRow, setExpandedRow] = useState(null);

  return (
    <div className="table-container-premium">
      <table className="table-premium">
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
          {sales.map((sale) => {
            const isExpanded = expandedRow === sale.id;
            const items = sale.items || sale.detalles || [];
            const tipo = sale.tipoComprobante || 'BOLETA';
            const estado = sale.estadoSunat || sale.comprobanteEstado || sale.estado || 'PENDIENTE';
            const canEmitNC = tipo !== 'NOTA_CREDITO' && tipo !== 'NOTA_DEBITO' && estado !== 'ANULADO';

            return (
              <>
                <tr key={sale.id} className={isExpanded ? 'row-expanded' : ''}>
                  <td>
                    <button className="btn-expand" onClick={() => setExpandedRow(isExpanded ? null : sale.id)}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                  <td><span className="badge-premium neutral" style={{ fontFamily: 'monospace' }}>{sale.comprobanteNumero || sale.numeroCompleto || sale.invoiceNumber || sale.numeroVenta || sale.numeroComprobante}</span></td>
                  <td><span className={`badge-premium ${tipo === 'FACTURA' ? 'info' : 'neutral'}`}>{getTipoComprobanteLabel(tipo)}</span></td>
                  <td><EstadoBadge sale={sale} /></td>
                  <td style={{ maxWidth: '160px' }}>
                    <span className="cell-primary" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={sale.customer?.razonSocial || sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'}>
                      {sale.customer?.name || sale.customer?.razonSocial || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'}
                    </span>
                  </td>
                  <td>{formatCurrency(sale.subtotal || calculateSubtotalSinIGV(sale.total || 0), currency)}</td>
                  <td className="cell-muted">{formatCurrency(sale.tax || sale.igv || calculateIGV(sale.total || 0), currency)}</td>
                  <td className="cell-currency">{formatCurrency(sale.total, currency)}</td>
                  <td>
                    <span className="badge-premium neutral">
                      {getPaymentMethodLabel(sale.paymentMethod || sale.metodoPago)}
                    </span>
                  </td>
                  <td className="cell-muted">{formatShortDate(sale.date || sale.fechaEmision || sale.createdAt)}</td>
                  <td>
                    <div className="action-cell">
                      <button className="btn-action-premium" onClick={() => onViewSale(sale)} title="Ver comprobante">
                        <Eye size={16} />
                      </button>
                      <button className="btn-action-premium" onClick={() => onDownloadPdf(sale)} title="Descargar PDF">
                        <FileDown size={16} />
                      </button>
                      <button className="btn-action-premium" onClick={() => onDownloadXml(sale)} title="Descargar XML">
                        <FileCode2 size={16} />
                      </button>
                      {estado === 'PENDIENTE' && (
                        <button className="btn-action-premium" onClick={() => onReenviar(sale)} disabled={processing} title="Reenviar a SUNAT">
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {isExpanded && (
                  <tr key={`${sale.id}-detail`} className="expanded-detail-row">
                    <td colSpan={11}>
                      <div className="expanded-detail">
                        <div className="expanded-detail-grid">
                          <div className="expanded-section">
                            <h4>Detalle de productos</h4>
                            <table className="detail-table">
                              <thead>
                                <tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Desc.</th><th>Total</th></tr>
                              </thead>
                              <tbody>
                                {items.map((item, idx) => {
                                  const qty = item.quantity || item.cantidad || 0;
                                  const price = item.price || item.precioUnitario || 0;
                                  const disc = item.discount || item.descuento || 0;
                                  return (
                                    <tr key={idx}>
                                      <td>{item.name || item.productName || item.productoNombre}</td>
                                      <td>{qty}</td>
                                      <td>{formatCurrency(price, currency)}</td>
                                      <td>{disc > 0 ? `${disc}%` : '-'}</td>
                                      <td>{formatCurrency(price * qty * (1 - disc / 100), currency)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="expanded-section">
                            <h4>Información del comprobante</h4>
                            <div className="expanded-info-list">
                              <div className="expanded-info-row"><span>Serie-Correlativo:</span><strong>{sale.comprobanteNumero || sale.numeroCompleto || sale.invoiceNumber || sale.numeroVenta || '-'}</strong></div>
                              <div className="expanded-info-row"><span>Fecha emisión:</span><span>{formatDate(sale.date || sale.fechaEmision || sale.createdAt)}</span></div>
                              <div className="expanded-info-row"><span>Cliente:</span><span>{sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'}</span></div>
                              {sale.customer?.numeroDocumento && (
                                <div className="expanded-info-row"><span>{sale.customer.tipoDocumento}:</span><span>{sale.customer.numeroDocumento}</span></div>
                              )}
                              <div className="expanded-info-row"><span>Método de pago:</span><span>{getPaymentMethodLabel(sale.paymentMethod || sale.metodoPago)}</span></div>
                              {sale.descuento > 0 && (
                                <div className="expanded-info-row"><span>Descuento global:</span><span style={{ color: 'var(--color-danger)' }}>{formatCurrency(sale.descuento, currency)}</span></div>
                              )}
                              <div className="expanded-info-row"><span>Op. Gravada:</span><span>{formatCurrency(sale.subtotal || calculateSubtotalSinIGV(sale.total || 0), currency)}</span></div>
                              <div className="expanded-info-row"><span>IGV (18%):</span><span>{formatCurrency(sale.tax || sale.igv || calculateIGV(sale.total || 0), currency)}</span></div>
                              <div className="expanded-info-row" style={{ fontWeight: 700 }}><span>Importe Total:</span><span className="text-accent">{formatCurrency(sale.total, currency)}</span></div>
                            </div>
                            {canEmitNC && (
                              <div style={{ marginTop: '12px' }}>
                                <button className="btn btn-danger btn-sm" onClick={() => { onNotaCredito(sale); setExpandedRow(null); }}>
                                  <XCircle size={14} /> Emitir Nota Crédito
                                </button>
                              </div>
                            )}
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
  );
}
