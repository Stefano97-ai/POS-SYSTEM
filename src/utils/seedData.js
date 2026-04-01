import { v4 as uuidv4 } from 'uuid';

export const defaultSettings = {
  businessName: 'Importaciones Nuñez',
  ruc: '10095470837',
  razonSocial: 'Nuñez Quiñonez Jesus Alberto',
  nombreComercial: 'Importaciones Nuñez',
  address: 'Av. Tupac Amaru Nro. 306, Urb. El Progreso, Carabayllo, Lima, Perú',
  ubigeo: '150106',
  phone: '991 900 034',
  email: 'jesucito2443@hotmail.com',
  taxRate: 18,
  currency: 'S/.',
  moneda: 'PEN',
  logo: null,
};

export const defaultCategories = [
  'Maletas',
  'Bolsos de Mano',
  'Mochilas Escolares',
  'Bolsos Ejecutivos',
  'Talabartería',
  'Máquinas Textiles',
  'Repuestos',
];

export const defaultProducts = [
  // Maletas
  { id: uuidv4(), name: 'Maleta de Viaje Grande', price: 120.00, category: 'Maletas', stock: 25, barcode: 'MAL-001', modelo: 'Viajero Plus', tamanio: 'Grande', color: 'Negro', material: 'Lona reforzada' },
  { id: uuidv4(), name: 'Maleta de Viaje Mediana', price: 85.00, category: 'Maletas', stock: 30, barcode: 'MAL-002', modelo: 'Viajero Plus', tamanio: 'Mediano', color: 'Azul', material: 'Lona reforzada' },
  { id: uuidv4(), name: 'Maleta de Viaje Pequeña', price: 55.00, category: 'Maletas', stock: 40, barcode: 'MAL-003', modelo: 'Viajero Lite', tamanio: 'Pequeño', color: 'Rojo', material: 'Poliéster' },
  // Bolsos de Mano
  { id: uuidv4(), name: 'Bolso de Mano Elegante', price: 45.00, category: 'Bolsos de Mano', stock: 35, barcode: 'BOL-001', modelo: 'Clásico', tamanio: 'Mediano', color: 'Marrón', material: 'Cuero sintético' },
  { id: uuidv4(), name: 'Cartera Dama Premium', price: 65.00, category: 'Bolsos de Mano', stock: 20, barcode: 'BOL-002', modelo: 'Premium', tamanio: 'Mediano', color: 'Negro', material: 'Cuero genuino' },
  { id: uuidv4(), name: 'Bolso Casual Multiuso', price: 35.00, category: 'Bolsos de Mano', stock: 50, barcode: 'BOL-003', modelo: 'Casual', tamanio: 'Grande', color: 'Beige', material: 'Lona' },
  // Mochilas Escolares
  { id: uuidv4(), name: 'Mochila Escolar Reforzada', price: 38.00, category: 'Mochilas Escolares', stock: 60, barcode: 'MOC-001', modelo: 'Escolar Pro', tamanio: 'Grande', color: 'Azul', material: 'Poliéster 600D' },
  { id: uuidv4(), name: 'Mochila Infantil Estampada', price: 28.00, category: 'Mochilas Escolares', stock: 45, barcode: 'MOC-002', modelo: 'Kids Fun', tamanio: 'Pequeño', color: 'Multicolor', material: 'Poliéster' },
  { id: uuidv4(), name: 'Mochila Juvenil con Ruedas', price: 55.00, category: 'Mochilas Escolares', stock: 20, barcode: 'MOC-003', modelo: 'Roller', tamanio: 'Grande', color: 'Negro/Rojo', material: 'Nylon' },
  // Bolsos Ejecutivos
  { id: uuidv4(), name: 'Maletín Ejecutivo Laptop 15"', price: 95.00, category: 'Bolsos Ejecutivos', stock: 15, barcode: 'EJE-001', modelo: 'Business Pro', tamanio: '15 pulgadas', color: 'Negro', material: 'Cuero sintético' },
  { id: uuidv4(), name: 'Portafolio Profesional', price: 75.00, category: 'Bolsos Ejecutivos', stock: 18, barcode: 'EJE-002', modelo: 'Executive', tamanio: 'Estándar', color: 'Marrón', material: 'Cuero genuino' },
  // Talabartería
  { id: uuidv4(), name: 'Cinturón de Cuero Clásico', price: 25.00, category: 'Talabartería', stock: 80, barcode: 'TAL-001', modelo: 'Clásico', tamanio: 'Unitalla', color: 'Negro', material: 'Cuero genuino' },
  { id: uuidv4(), name: 'Correa Casual Trenzada', price: 18.00, category: 'Talabartería', stock: 60, barcode: 'TAL-002', modelo: 'Trenzado', tamanio: 'Unitalla', color: 'Marrón', material: 'Cuero sintético' },
  { id: uuidv4(), name: 'Cinturón Doble Hebilla', price: 32.00, category: 'Talabartería', stock: 40, barcode: 'TAL-003', modelo: 'Doble', tamanio: 'Unitalla', color: 'Negro', material: 'Cuero genuino' },
  // Máquinas Textiles
  { id: uuidv4(), name: 'Máquina de Costura Industrial', price: 1800.00, category: 'Máquinas Textiles', stock: 3, barcode: 'MAQ-001', modelo: 'Industrial 3000', tamanio: 'Industrial', color: 'Blanco', material: 'Metal/Plástico' },
  { id: uuidv4(), name: 'Máquina de Corte Eléctrica', price: 950.00, category: 'Máquinas Textiles', stock: 5, barcode: 'MAQ-002', modelo: 'CortaPro', tamanio: 'Mediano', color: 'Gris', material: 'Metal' },
  // Repuestos
  { id: uuidv4(), name: 'Bobina para Máquina Industrial', price: 8.00, category: 'Repuestos', stock: 150, barcode: 'REP-001', modelo: 'Universal', tamanio: 'Estándar', color: 'Plateado', material: 'Metal' },
  { id: uuidv4(), name: 'Aguja Industrial (paq. x10)', price: 12.00, category: 'Repuestos', stock: 100, barcode: 'REP-002', modelo: 'DB×1', tamanio: '#14', color: 'Plateado', material: 'Acero' },
  { id: uuidv4(), name: 'Pie Prénsatela Universal', price: 15.00, category: 'Repuestos', stock: 35, barcode: 'REP-003', modelo: 'Universal', tamanio: 'Estándar', color: 'Plateado', material: 'Acero inoxidable' },
];

export const defaultCustomers = [
  { id: uuidv4(), name: 'Cliente General', email: '', phone: '', address: '', notes: '', tipoDocumento: 'SIN_DOC', numeroDocumento: '00000000', tipoCliente: 'PERSONA', clasificacion: 'FRECUENTE', totalPurchases: 0 },
  { id: uuidv4(), name: 'Grupo JPL PERÚ S.A.C.', email: '', phone: '', address: '', notes: 'Cliente corporativo', tipoDocumento: 'RUC', numeroDocumento: '20601234567', tipoCliente: 'EMPRESA', razonSocial: 'Grupo JPL PERÚ S.A.C.', clasificacion: 'CORPORATIVO', totalPurchases: 0 },
  { id: uuidv4(), name: 'Distribuidora El Maletín del Norte', email: '', phone: '', address: '', notes: 'Cliente corporativo', tipoDocumento: 'RUC', numeroDocumento: '20609876543', tipoCliente: 'EMPRESA', razonSocial: 'Distribuidora El Maletín del Norte', clasificacion: 'CORPORATIVO', totalPurchases: 0 },
  { id: uuidv4(), name: 'I.E.P Los Andes', email: '', phone: '', address: '', notes: 'Cliente corporativo - compras escolares', tipoDocumento: 'RUC', numeroDocumento: '20551234890', tipoCliente: 'EMPRESA', razonSocial: 'I.E.P Los Andes', clasificacion: 'CORPORATIVO', totalPurchases: 0 },
  { id: uuidv4(), name: 'CorpGifts S.A.C.', email: '', phone: '', address: '', notes: 'Cliente corporativo', tipoDocumento: 'RUC', numeroDocumento: '20607654321', tipoCliente: 'EMPRESA', razonSocial: 'CorpGifts S.A.C.', clasificacion: 'CORPORATIVO', totalPurchases: 0 },
];
