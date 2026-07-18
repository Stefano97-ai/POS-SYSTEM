import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency, getPaymentMethodLabel, numeroALetras } from '../utils/helpers';

// <!-- CAMBIO N°1: Lógica de validación mejorada para bloquear emisión si faltan datos críticos -->
export const validateComprobante = (sale) => {
  const total = sale.total || 0;
  const tipo = (sale.tipoComprobante || 'BOLETA').toUpperCase();
  const doc = sale.customer?.numeroDocumento || '';
  const name = sale.customer?.name || sale.customer?.nombre || '';
  const address = sale.customer?.address || '';

  if (tipo === 'FACTURA') {
    if (doc.length !== 11 || !/^\d+$/.test(doc)) {
      return "No se puede emitir Factura sin datos del cliente. Complete el RUC (11 dígitos).";
    }
    if (!name.trim()) {
      return "No se puede emitir Factura sin datos del cliente. Complete la Razón Social.";
    }
    if (!address.trim()) {
      return "No se puede emitir Factura sin datos del cliente. Complete la Dirección Fiscal.";
    }
  }

  if (tipo === 'BOLETA' && total >= 700) {
    if (!doc || doc.length < 8) {
      return "Para montos mayores a S/ 700 es obligatorio el DNI/Documento del cliente.";
    }
    if (!name.trim()) {
      return "El Nombre completo es obligatorio para montos mayores a S/ 700.";
    }
  }

  // Validación de productos
  const items = sale.items || sale.detalles || [];
  if (items.some(item => !(item.name || item.productName || item.productoNombre))) {
    return "Error: Uno o más productos no tienen descripción. La descripción es obligatoria por SUNAT.";
  }

  return null;
};

export default function InvoicePreview({ sale, onPrint }) {
  if (!sale) return null;

  const businessInfo = sale.businessInfo || {};
  const currency = businessInfo.currency || 'S/.';
  
  const tipo = (sale.tipoComprobante || 'BOLETA').toUpperCase();
  const isFactura = tipo === 'FACTURA';
  
  const docTypeLabel = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
  const customerIdLabel = isFactura ? 'RUC' : 'DNI';

  const getRealInvoiceNumber = () => {
    const realNum = sale.comprobanteNumero || sale.numeroCompleto || sale.invoiceNumber || sale.numeroVenta || sale.numeroComprobante;
    if (!realNum) return isFactura ? 'F001-00000001' : 'B001-00000001';
    return realNum;
  };
  const displayInvoiceNumber = getRealInvoiceNumber();

  // <!-- CAMBIO N°2: Formato de fecha/hora 24h más limpio -->
  const saleDate = new Date(sale.date || sale.createdAt || new Date());
  const formattedDate = saleDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDateTime = `${formattedDate} ${formattedTime}`;

  const items = sale.items || sale.detalles || [];
  const subtotal = sale.subtotal || (sale.total / 1.18);
  const tax = sale.tax || sale.igv || (sale.total - subtotal);

  const qrValue = [
    businessInfo.ruc || '10095470837',
    isFactura ? '01' : '03',
    (displayInvoiceNumber).split('-')[0],
    (displayInvoiceNumber).split('-')[1],
    tax.toFixed(2),
    (sale.total || 0).toFixed(2),
    saleDate.toISOString().split('T')[0],
    isFactura ? '6' : '1',
    sale.customer?.numeroDocumento || '00000000',
    ''
  ].join('|');

  // <!-- CAMBIO N°3: Lógica para ocultar método de pago si es efectivo -->
  const paymentMethod = (sale.paymentMethod || sale.metodoPago || '').toUpperCase();
  const showPaymentMethod = isFactura || paymentMethod !== 'EFECTIVO';

  return (
    <div className="invoice-preview-v4" style={{ overflow: 'visible', fontSize: '13px', lineHeight: '1.4' }}>
      {/* <!-- CAMBIO N°4: Tipografía Sans-Serif moderna (Arial/Roboto) --> */}
      <style>{`
        .invoice-preview-v4 { 
          width: 100%; 
          max-width: 800px; 
          margin: 0 auto; 
          background: #fff; 
          padding: 20px; 
          color: #000; 
          font-family: Arial, Helvetica, sans-serif; 
        }
        .v4-center { text-align: center; }
        .v4-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .v4-table th { background: #f8f9fa; padding: 8px; border-bottom: 2px solid #000; text-align: left; font-size: 12px; }
        .v4-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; vertical-align: top; }
        .v4-total-box { background: #000; color: #fff; padding: 10px; margin-top: 5px; font-weight: bold; display: flex; justifyContent: space-between; align-items: center; }
        @media print { 
          .no-print { display: none !important; } 
          .invoice-preview-v4 { width: 80mm; padding: 5px; margin: 0; }
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="v4-center">
        <div style={{ margin: '-50px auto -30px', maxWidth: '350px' }}>
          <img src={`/assets/logo_limpio_nunez.png?t=${new Date().getTime()}`} alt="Logo" style={{ width: '100%', height: 'auto' }} />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>IMPORTACIONES NÚÑEZ</div>
          <div style={{ fontSize: '0.95rem', color: '#444', fontStyle: 'italic' }}>Global Trading & Logistics</div>
          <div style={{ fontSize: '0.8rem', marginTop: '5px', fontWeight: 'bold' }}>Núñez Quiñónez Jesús Alberto</div>
          <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
            {businessInfo.address || 'Av. Tupac Amaru Nro. 306, Urb. El Progreso, Carabayllo - Lima'}<br />
            Teléfono: {businessInfo.phone || '991 900 034'} | E-Mail: {businessInfo.email || 'ventas@importacionesnunez.com'}
          </div>
        </div>

        <div style={{ border: '2.5px solid #000', padding: '12px', borderRadius: '4px', display: 'inline-block', minWidth: '320px', marginBottom: '25px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>RUC: {businessInfo.ruc || '10095470837'}</div>
          <div style={{ margin: '8px 0', fontSize: '1.1rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{docTypeLabel}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{displayInvoiceNumber}</div>
        </div>
      </div>

      {/* <!-- CAMBIO N°5: Datos del cliente (Mapeo corregido con campos del backend: clienteRazonSocial, clienteDireccion) --> */}
      <div style={{ borderBottom: '1px solid #000', paddingBottom: '12px', marginBottom: '18px' }}>
        {(isFactura || sale.clienteRazonSocial || sale.customer?.razonSocial || sale.customer?.nombre || sale.customer?.name || sale.clienteNombre) && (
          <div style={{ marginBottom: '4px' }}>
            <strong style={{ display: 'inline-block', width: '90px' }}>Sr. o Sres:</strong> 
            <span>
              {sale.clienteRazonSocial || sale.customer?.razonSocial || sale.customer?.nombre || sale.customer?.name || sale.clienteNombre || (isFactura ? '[RAZÓN SOCIAL PENDIENTE]' : 'CLIENTE GENERAL')}
            </span>
          </div>
        )}
        {(isFactura || sale.clienteDireccion || sale.customer?.direccion || sale.customer?.address || sale.clienteDireccion) && (
          <div style={{ marginBottom: '4px' }}>
            <strong style={{ display: 'inline-block', width: '90px' }}>Dirección:</strong> 
            <span>{sale.clienteDireccion || sale.customer?.direccion || sale.customer?.address || sale.clienteDireccion || sale.customerDireccion || (isFactura ? '[DIRECCIÓN PENDIENTE]' : '—')}</span>
          </div>
        )}
        {(isFactura || sale.clienteDocumento || sale.customer?.numeroDocumento || sale.customer?.documento || sale.clienteRuc) && (
          <div style={{ marginBottom: '4px' }}>
            <strong style={{ display: 'inline-block', width: '90px' }}>{customerIdLabel}:</strong> 
            <span>{sale.clienteDocumento || sale.customer?.numeroDocumento || sale.customer?.documento || sale.customer?.dni || sale.clienteRuc || sale.clienteDni || (isFactura ? '[RUC PENDIENTE]' : '—')}</span>
          </div>
        )}
        <div style={{ marginBottom: '4px' }}>
          <strong style={{ display: 'inline-block', width: '90px' }}>F. Emisión:</strong> 
          <span>{formattedDateTime}</span>
        </div>
        
        {showPaymentMethod && (
          <div style={{ marginBottom: '4px' }}>
            <strong style={{ display: 'inline-block', width: '90px' }}>Pago:</strong> 
            <span>{getPaymentMethodLabel(sale.paymentMethod || sale.metodoPago)}</span>
          </div>
        )}
      </div>

      {/* ITEMS TABLE */}
      <table className="v4-table">
        <thead>
          <tr>
            <th width="12%">UNID.</th>
            <th width="8%">CANT.</th>
            <th width="44%">DESCRIPCIÓN</th>
            <th width="18%" style={{ textAlign: 'right' }}>P. UNIT.</th>
            <th width="18%" style={{ textAlign: 'right' }}>IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td style={{ fontSize: '0.75rem' }}>UNIDAD</td>
              <td style={{ textAlign: 'center' }}>{item.quantity || item.cantidad}</td>
              {/* <!-- CAMBIO N°6: Corrección de Descripción (soporta múltiples nombres de campo) --> */}
              <td>
                <div style={{ fontWeight: 'bold' }}>{item.name || item.productName || item.productoNombre || '[SIN DESCRIPCIÓN]'}</div>
                {(item.modelo || item.color || item.tamanio) && (
                  <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>
                    {item.modelo && `Modelo: ${item.modelo}`} {item.color && `| Color: ${item.color}`} {item.tamanio && `| Talla: ${item.tamanio}`}
                  </div>
                )}
              </td>
              {/* S/ siempre junto al número */}
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(item.price || item.precioUnitario, currency)}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency((item.price || item.precioUnitario) * (item.quantity || item.cantidad), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS SECTION */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>OP. GRAVADA:</span>
            <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(subtotal, currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>IGV (18%):</span>
            <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(tax, currency)}</span>
          </div>
          {/* IMPORTE TOTAL en una sola línea, sin corte */}
          <div className="v4-total-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', flexShrink: 0 }}>IMPORTE TOTAL VENTA:</span>
            <span style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>{formatCurrency(sale.total, currency)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px', background: '#f8f9fa', borderLeft: '4px solid #000', marginTop: '15px', fontSize: '0.85rem' }}>
        <strong>SON:</strong> {numeroALetras(sale.total).toUpperCase()}
      </div>

      {/* FOOTER & LEGAL */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '25px', color: '#333', borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <strong>Facturador Electrónico SEE - SUNAT</strong><br />
        Representación impresa de la {tipo.toLowerCase()} de venta electrónica.<br />
        Consulte su documento en: <strong>www.importacionesnunez.pe/comprobantes</strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '15px' }}>
        <QRCodeSVG value={qrValue} size={110} level="M" />
        <div style={{ fontSize: '10px', color: '#999', marginTop: '10px', textAlign: 'center', maxWidth: '350px', fontFamily: 'monospace' }}>
          <strong>Código Hash SUNAT:</strong><br />
          <span style={{ wordBreak: 'break-all' }}>{sale.hash || sale.codigoHash || "Enviando firma digital a SUNAT..."}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
        ¡MUCHAS GRACIAS POR SU PREFERENCIA!
      </div>

      {onPrint && (
        <div className="no-print" style={{ textAlign: 'center', marginTop: '30px' }}>
          <button className="btn btn-primary" onClick={onPrint} style={{ padding: '12px 30px', fontWeight: 'bold' }}>
            Imprimir Comprobante
          </button>
        </div>
      )}
    </div>
  );
}

