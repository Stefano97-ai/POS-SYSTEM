import { formatCurrency, formatDate, getPaymentMethodLabel, getTipoComprobanteLabel } from '../utils/helpers';

export default function InvoicePreview({ sale, onPrint }) {
  if (!sale) return null;

  const businessInfo = sale.businessInfo || {};
  const currency = businessInfo.currency || 'S/.';

  return (
    <div className="invoice-preview">
      <div className="invoice-header">
        <h2 className="invoice-business-name">{businessInfo.businessName || businessInfo.nombreComercial || 'Importaciones Nuñez'}</h2>
        <p className="invoice-business-detail">{businessInfo.razonSocial || 'Nuñez Quiñonez Jesus Alberto'}</p>
        <p className="invoice-business-detail">RUC: {businessInfo.ruc || '10095470837'}</p>
        <p className="invoice-business-detail">{businessInfo.address || businessInfo.direccion}</p>
        <p className="invoice-business-detail">Tel: {businessInfo.phone || businessInfo.telefono}</p>
        {businessInfo.email && <p className="invoice-business-detail">{businessInfo.email}</p>}
      </div>

      <div className="invoice-divider" />

      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <strong style={{ fontSize: '1.1rem', textTransform: 'uppercase' }}>
          {getTipoComprobanteLabel(sale.tipoComprobante || 'BOLETA')} Electrónica
        </strong>
      </div>

      <div className="invoice-divider" />

      <div className="invoice-meta">
        <div className="invoice-meta-row">
          <span>N° Comprobante:</span>
          <strong>{sale.invoiceNumber || sale.numeroVenta || sale.numeroComprobante}</strong>
        </div>
        <div className="invoice-meta-row">
          <span>Fecha de Emisión:</span>
          <span>{formatDate(sale.date || sale.fechaEmision || sale.createdAt)}</span>
        </div>
        <div className="invoice-meta-row">
          <span>Cliente:</span>
          <span>{sale.customer?.name || sale.customer?.nombre || sale.clienteNombre || 'Cliente General'}</span>
        </div>
        {sale.customer?.tipoDocumento && sale.customer.tipoDocumento !== 'SIN_DOC' && (
          <div className="invoice-meta-row">
            <span>{sale.customer.tipoDocumento}:</span>
            <span>{sale.customer.numeroDocumento}</span>
          </div>
        )}
        {sale.customer?.direccion && (
          <div className="invoice-meta-row">
            <span>Dirección:</span>
            <span>{sale.customer.direccion}</span>
          </div>
        )}
        <div className="invoice-meta-row">
          <span>Método de pago:</span>
          <span>{getPaymentMethodLabel(sale.paymentMethod || sale.metodoPago)}</span>
        </div>
      </div>

      <div className="invoice-divider" />

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>P. Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {(sale.items || sale.detalles || []).map((item, index) => (
            <tr key={index}>
              <td>{item.name || item.productName || item.productoNombre}</td>
              <td>{item.quantity || item.cantidad}</td>
              <td>{formatCurrency(item.price || item.precioUnitario, currency)}</td>
              <td>{formatCurrency((item.price || item.precioUnitario) * (item.quantity || item.cantidad), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-divider" />

      <div className="invoice-totals">
        <div className="invoice-total-row">
          <span>Op. Gravada:</span>
          <span>{formatCurrency(sale.subtotal, currency)}</span>
        </div>
        <div className="invoice-total-row">
          <span>IGV ({sale.taxRate || 18}%):</span>
          <span>{formatCurrency(sale.tax || sale.igv, currency)}</span>
        </div>
        <div className="invoice-total-row invoice-grand-total">
          <span>IMPORTE TOTAL:</span>
          <span>{formatCurrency(sale.total, currency)}</span>
        </div>
        {(sale.paymentMethod === 'EFECTIVO' || sale.paymentMethod === 'cash' || sale.metodoPago === 'EFECTIVO') && sale.amountPaid > 0 && (
          <>
            <div className="invoice-total-row">
              <span>Recibido:</span>
              <span>{formatCurrency(sale.amountPaid || sale.montoPagado, currency)}</span>
            </div>
            <div className="invoice-total-row">
              <span>Vuelto:</span>
              <span>{formatCurrency(sale.change || sale.vuelto || 0, currency)}</span>
            </div>
          </>
        )}
      </div>

      <div className="invoice-footer">
        <p>¡Gracias por su compra!</p>
        <p style={{ fontSize: '0.7rem', marginTop: '4px', color: '#999' }}>
          Representación impresa de la {getTipoComprobanteLabel(sale.tipoComprobante || 'BOLETA')} Electrónica
        </p>
      </div>

      {onPrint && (
        <button className="btn btn-primary btn-lg invoice-print-btn" onClick={onPrint}>
          Imprimir Comprobante
        </button>
      )}
    </div>
  );
}
