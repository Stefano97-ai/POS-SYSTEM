import { formatCurrency, getPaymentMethodLabel, getTipoComprobanteLabel } from '../../utils/helpers';

export default function RecentSalesTable({ sales, currency }) {
  if (sales.length === 0) return null;
  return (
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
            {sales.map((s) => (
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
  );
}
