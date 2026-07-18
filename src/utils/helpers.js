export const formatCurrency = (amount, currency = 'S/.') => {
  const num = Number(amount).toFixed(2);
  if (currency === 'S/.' || currency === 'PEN') {
    return `S/ ${num}`;
  }
  return `${currency}${num}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `V-${year}${month}${day}-${random}`;
};

export const calculateTax = (subtotal, taxRate = 18) => {
  return subtotal * (taxRate / 100);
};

export const calculateIGV = (precioConIGV) => {
  // Extrae el IGV de un precio que ya incluye IGV (precio de venta al público)
  return precioConIGV - (precioConIGV / 1.18);
};

export const calculateSubtotalSinIGV = (precioConIGV) => {
  // Calcula el valor de venta (sin IGV) a partir del precio con IGV incluido
  return precioConIGV / 1.18;
};

export const getToday = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isThisMonth = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

export const isThisWeek = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek && date <= today;
};

export const getPaymentMethodLabel = (method) => {
  const labels = {
    'EFECTIVO': 'Efectivo',
    'TRANSFERENCIA': 'Transferencia',
    'YAPE_PLIN': 'Yape/Plin',
    'TARJETA': 'Tarjeta',
    'CREDITO': 'Crédito',
    'cash': 'Efectivo',
    'card': 'Tarjeta',
  };
  return labels[method] || method;
};

export const getTipoComprobanteLabel = (tipo) => {
  const labels = {
    'FACTURA': 'Factura',
    'BOLETA': 'Boleta',
    'NOTA_CREDITO': 'Nota de Crédito',
    'NOTA_DEBITO': 'Nota de Débito',
    'NOTA_VENTA': 'Nota de Venta',
  };
  return labels[tipo] || tipo;
};

// Normaliza los campos del backend a nombres consistentes usados en el frontend
export const normalizeProduct = (p) => ({
  ...p,
  name: p.nombre || p.name || '',
  price: Number(p.precioVenta ?? p.price ?? 0),
  costPrice: Number(p.precioCompra ?? p.costPrice ?? 0),
  barcode: p.codigoBarras || p.barcode || p.codigo || '',
  category: p.categoriaNombre || p.category || p.categoria || '',
});

export const getStockLevel = (product) => {
  const stock = product.stock || 0;
  const min = product.stockMinimo || 5;
  if (stock === 0) return 'critical';
  if (stock <= min) return 'low';
  if (stock <= min * 2) return 'medium';
  return 'good';
};

export function numeroALetras(num) {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETETIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertir(n) {
    if (n === 0) return 'CERO';
    if (n === 100) return 'CIEN';
    if (n < 10) return unidades[n];
    if (n < 20) return n === 10 ? decenas[0] : especiales[n - 11];
    if (n < 100) {
      const u = n % 10;
      return decenas[Math.floor(n / 10) - 1] + (u > 0 ? ' Y ' + unidades[u] : '');
    }
    if (n < 1000) {
      const d = n % 100;
      return centenas[Math.floor(n / 100) - 1] + (d > 0 ? ' ' + convertir(d) : '');
    }
    if (n < 1000000) {
      const m = Math.floor(n / 1000);
      const r = n % 1000;
      let s = (m === 1 ? 'MIL' : convertir(m) + ' MIL');
      if (r > 0) s += ' ' + convertir(r);
      return s;
    }
    return '';
  }

  const entero = Math.floor(num);
  const decimales = Math.round((num - entero) * 100);
  return `${convertir(entero)} CON ${String(decimales).padStart(2, '0')}/100 SOLES`.toUpperCase();
}

