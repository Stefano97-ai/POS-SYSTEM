import axios from 'axios';

const API = axios.create({ baseURL: '/api/v1' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const unwrap = (res) => {
  const data = res.data.data;
  // Auto-extract content array from paginated responses
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.content)) {
    return data.content;
  }
  return data;
};

export const api = {
  // Auth
  login: (creds) => API.post('/auth/login', creds).then(unwrap),
  refresh: (token) => API.post('/auth/refresh', { refreshToken: token }).then(unwrap),
  logout: () => API.post('/auth/logout'),

  // Usuarios
  getUsuarios: () => API.get('/usuarios').then(unwrap),
  createUsuario: (data) => API.post('/usuarios', data).then(unwrap),
  updateUsuario: (id, data) => API.put(`/usuarios/${id}`, data).then(unwrap),
  deleteUsuario: (id) => API.delete(`/usuarios/${id}`),

  // Productos
  getProductos: (page = 0, size = 100) => API.get(`/productos?page=${page}&size=${size}`).then(unwrap),
  getProducto: (id) => API.get(`/productos/${id}`).then(unwrap),
  buscarProductos: (q) => API.get(`/productos/buscar?q=${q}`).then(unwrap),
  stockBajo: () => API.get('/productos/stock-bajo').then(unwrap),
  createProducto: (data) => API.post('/productos', data).then(unwrap),
  updateProducto: (id, data) => API.put(`/productos/${id}`, data).then(unwrap),
  deleteProducto: (id) => API.delete(`/productos/${id}`),

  // Aliases — usados por los componentes del frontend
  getProducts: (page = 0, size = 100) => API.get(`/productos?page=${page}&size=${size}`).then(unwrap),
  createProduct: (data) => API.post('/productos', data).then(unwrap),
  updateProduct: (id, data) => API.put(`/productos/${id}`, data).then(unwrap),
  deleteProduct: (id) => API.delete(`/productos/${id}`),

  // Categorias
  getCategorias: () => API.get('/categorias').then(unwrap),
  createCategoria: (data) => API.post('/categorias', data).then(unwrap),

  // Inventario
  getKardex: (productoId, page = 0) => API.get(`/inventario/kardex/${productoId}?page=${page}&size=50`).then(unwrap),
  entradaStock: (data) => API.post('/inventario/entrada', data).then(unwrap),
  ajusteStock: (data) => API.post('/inventario/ajuste', data).then(unwrap),

  // Clientes
  getClientes: (page = 0, size = 100) => API.get(`/clientes?page=${page}&size=${size}`).then(unwrap),
  buscarClientes: (q) => API.get(`/clientes/buscar?q=${q}`).then(unwrap),
  getCliente: (id) => API.get(`/clientes/${id}`).then(unwrap),
  historialCliente: (id) => API.get(`/clientes/${id}/historial`).then(unwrap),
  createCliente: (data) => API.post('/clientes', data).then(unwrap),
  updateCliente: (id, data) => API.put(`/clientes/${id}`, data).then(unwrap),
  deleteCliente: (id) => API.delete(`/clientes/${id}`),

  // Aliases
  getCustomers: (page = 0, size = 100) => API.get(`/clientes?page=${page}&size=${size}`).then(unwrap),
  createCustomer: (data) => API.post('/clientes', data).then(unwrap),
  updateCustomer: (id, data) => API.put(`/clientes/${id}`, data).then(unwrap),
  deleteCustomer: (id) => API.delete(`/clientes/${id}`),

  // Ventas
  getVentas: (page = 0, size = 20) => API.get(`/ventas?page=${page}&size=${size}`).then(unwrap),
  getVenta: (id) => API.get(`/ventas/${id}`).then(unwrap),
  createVenta: (data) => API.post('/ventas', data).then(unwrap),
  anularVenta: (id, motivo) => API.post(`/ventas/${id}/anular`, { motivo }).then(unwrap),

  // Aliases
  getSales: (page = 0, size = 50) => API.get(`/ventas?page=${page}&size=${size}`).then(unwrap),
  createSale: (data) => API.post('/ventas', data).then(unwrap),

  // Comprobantes
  getComprobantes: (page = 0, size = 20) => API.get(`/comprobantes?page=${page}&size=${size}`).then(unwrap),
  getComprobante: (id) => API.get(`/comprobantes/${id}`).then(unwrap),
  getComprobantePdf: (id) => API.get(`/comprobantes/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
  getComprobanteXml: (id) => API.get(`/comprobantes/${id}/xml`, { responseType: 'blob' }).then(r => r.data),
  reenviarComprobante: (id) => API.post(`/comprobantes/${id}/reenviar`).then(unwrap),
  consultarEstadoSunat: (id) => API.get(`/comprobantes/${id}/estado-sunat`).then(unwrap),
  createNotaCredito: (data) => API.post('/comprobantes/nota-credito', data).then(unwrap),
  createNotaDebito: (data) => API.post('/comprobantes/nota-debito', data).then(unwrap),
  resumenDiario: () => API.post('/comprobantes/resumen-diario').then(unwrap),
  comunicacionBaja: (data) => API.post('/comprobantes/comunicacion-baja', data).then(unwrap),

  // Proveedores
  getProveedores: () => API.get('/proveedores').then(unwrap),
  createProveedor: (data) => API.post('/proveedores', data).then(unwrap),
  updateProveedor: (id, data) => API.put(`/proveedores/${id}`, data).then(unwrap),
  deleteProveedor: (id) => API.delete(`/proveedores/${id}`),

  // Reportes
  getDashboard: () => API.get('/reportes/dashboard').then(unwrap),
  getReporteVentas: (desde, hasta) => API.get(`/reportes/ventas?desde=${desde}&hasta=${hasta}`).then(unwrap),
  exportarExcel: (desde, hasta) => API.get(`/reportes/exportar/excel?desde=${desde}&hasta=${hasta}`, { responseType: 'blob' }).then(r => r.data),

  // Configuracion
  getConfiguracion: () => API.get('/configuracion/empresa').then(unwrap),
  updateConfiguracion: (data) => API.put('/configuracion/empresa', data).then(unwrap),
  getSeries: () => API.get('/configuracion/series').then(unwrap),
  updateSerie: (id, serie) => API.put(`/configuracion/series/${id}`, { serie }).then(unwrap),
  subirCertificado: (file, password) => {
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);
    return API.post('/configuracion/certificado', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap);
  },
  validarCertificado: () => API.get('/configuracion/certificado/validar').then(unwrap),

  // Aliases
  getSettings: () => API.get('/configuracion/empresa').then(unwrap),
  updateSettings: (data) => API.put('/configuracion/empresa', data).then(unwrap),
};
