import { formatCurrency, formatShortDate, getPaymentMethodLabel, getTipoComprobanteLabel } from '../../utils/helpers';

export default function SalesDetailTable({ sales, currency }) {
  if (sales.length === 0) return null;
  return (
    <div className="data-card-premium" style={{ marginTop: '1.5rem' }}>
      <div className="page-header-premium" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <h3 className="section-title" style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Detalle de Ventas ({sales.length})</h3>
      </div>
      <div className="table-container-premium">
        <table className="table-premium">
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
            {sales.map((s) => (
              <tr key={s.id}>
                <td><span className="badge-premium neutral" style={{ fontFamily: 'monospace' }}>{s.invoiceNumber || s.numeroVenta}</span></td>
                <td><span className={`badge-premium ${(s.tipoComprobante || 'boleta').toLowerCase() === 'factura' ? 'info' : 'neutral'}`}>{getTipoComprobanteLabel(s.tipoComprobante || 'BOLETA')}</span></td>
                <td className="cell-primary">{s.customer?.name || s.customer?.nombre || s.clienteNombre || 'Cliente General'}</td>
                <td>{(s.items || s.detalles || []).reduce((a, i) => a + (i.quantity || i.cantidad || 0), 0)}</td>
                <td className="cell-currency">{formatCurrency(s.total, currency)}</td>
                <td><span className="badge-premium neutral">{getPaymentMethodLabel(s.paymentMethod || s.metodoPago)}</span></td>
                <td className="cell-muted">{formatShortDate(s.date || s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
