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
