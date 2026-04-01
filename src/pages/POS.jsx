import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { formatCurrency, getPaymentMethodLabel } from '../utils/helpers';
import ProductCard from '../components/ProductCard';
import CartItem from '../components/CartItem';
import Modal from '../components/Modal';
import InvoicePreview from '../components/InvoicePreview';
import {
  Search, ShoppingCart, CreditCard, Banknote, Trash2, CheckCircle,
  User, Smartphone, Building2, Receipt, Percent, UserPlus, Printer,
  Mail, X, Clock,
} from 'lucide-react';

const METODOS_PAGO = [
  { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { key: 'YAPE_PLIN', label: 'Yape/Plin', icon: Smartphone },
  { key: 'TRANSFERENCIA', label: 'Transferencia', icon: Building2 },
  { key: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
  { key: 'CREDITO', label: 'Crédito', icon: Clock },
];

export default function POS() {
  const { state, dispatch } = useApp();
  const { products, cart, settings, customers, selectedCustomer, globalDiscount } = state;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showPayment, setShowPayment] = useState(false);
  const [showPostSale, setShowPostSale] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [amountPaid, setAmountPaid] = useState('');
  const [lastSaleData, setLastSaleData] = useState(null);
  const [tipoComprobante, setTipoComprobante] = useState('BOLETA');
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false);

  // Búsqueda y registro rápido de cliente
  const [customerSearch, setCustomerSearch] = useState('');
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [quickForm, setQuickForm] = useState({
    name: '', tipoDocumento: 'DNI', numeroDocumento: '', tipoCliente: 'PERSONA',
    razonSocial: '', phone: '', email: '', address: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  const categories = ['Todos', ...state.categories.map(c => typeof c === 'string' ? c : c.nombre)];

  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch = (p.name || p.nombre || '').toLowerCase().includes(term) ||
      p.barcode?.includes(search) || p.codigo?.includes(search) || p.codigoBarras?.includes(search) ||
      (p.modelo || '').toLowerCase().includes(term);
    const matchCategory = activeCategory === 'Todos' ||
      p.category === activeCategory || p.categoriaNombre === activeCategory;
    return matchSearch && matchCategory;
  });

  // Filtrar clientes por búsqueda RUC/DNI/nombre
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return (c.name || c.nombre) !== 'Cliente General';
    const term = customerSearch.toLowerCase();
    return (c.name || c.nombre || '').toLowerCase().includes(term) ||
      (c.numeroDocumento || '').includes(customerSearch) ||
      (c.razonSocial || '').toLowerCase().includes(term);
  });

  // ===== CÁLCULOS IGV (precio incluye IGV en Perú) =====
  // Precio de venta al público YA INCLUYE IGV
  const precioVentaTotal = cart.reduce((sum, item) => {
    const price = item.price || item.precioVenta || 0;
    const qty = item.quantity || 0;
    const itemDiscount = item.discount || 0;
    const lineTotal = price * qty;
    return sum + lineTotal - (lineTotal * itemDiscount / 100);
  }, 0);

  // Descuento global
  const descuentoGlobal = precioVentaTotal * (globalDiscount / 100);
  const totalConIGV = precioVentaTotal - descuentoGlobal; // Precio final (incluye IGV)
  const valorVenta = totalConIGV / 1.18;   // Base imponible (sin IGV)
  const igv = totalConIGV - valorVenta;     // IGV extraído

  // Descuento total (por ítems + global)
  const descuentoItems = cart.reduce((sum, item) => {
    const price = item.price || item.precioVenta || 0;
    const lineTotal = price * (item.quantity || 0);
    return sum + (lineTotal * (item.discount || 0) / 100);
  }, 0);
  const descuentoTotal = descuentoItems + descuentoGlobal;

  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;
    const inCart = cart.find(i => i.id === product.id);
    if (inCart && inCart.quantity >= product.stock) {
      alert(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles.`);
      return;
    }
    // Normalizar campos backend (nombre/precioVenta) a los que usa el carrito (name/price)
    const normalized = {
      ...product,
      name: product.nombre || product.name,
      price: Number(product.precioVenta || product.price || 0),
    };
    dispatch({ type: 'ADD_TO_CART', payload: normalized });
  };

  const handleUpdateQuantity = (id, quantity) => {
    const product = products.find(p => p.id === id);
    if (product && quantity > product.stock) {
      alert(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles.`);
      return;
    }
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity } });
  };

  const handleUpdateDiscount = (id, discount) => {
    dispatch({ type: 'UPDATE_CART_DISCOUNT', payload: { id, discount } });
  };

  const handleRemove = (id) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (tipoComprobante === 'FACTURA' && (!selectedCustomer || selectedCustomer.tipoDocumento !== 'RUC')) {
      alert('Para emitir una Factura, debe seleccionar un cliente con RUC.');
      return;
    }
    setAmountPaid('');
    setPaymentMethod('EFECTIVO');
    setShowPayment(true);
  };

  const handleCompleteSale = async () => {
    const paid = paymentMethod !== 'EFECTIVO' ? totalConIGV : Number(amountPaid);
    if (paymentMethod === 'EFECTIVO' && paid < totalConIGV) return;

    try {
      const saleData = {
        clienteId: selectedCustomer?.id || null,
        tipoComprobante,
        metodoPago: paymentMethod,
        montoPagado: paid,
        descuentoGlobal: descuentoGlobal,
        items: cart.map(i => ({
          productoId: i.id,
          cantidad: i.quantity,
          descuento: i.discount || 0,
        })),
      };

      const savedSale = await api.createSale(saleData);

      // Preparar datos para la vista post-venta
      setLastSaleData({
        ...savedSale,
        // Fallbacks para la vista
        invoiceNumber: savedSale.invoiceNumber || savedSale.numeroVenta || savedSale.numeroComprobante,
        items: savedSale.items || savedSale.detalles || cart.map(i => ({
          name: i.name || i.nombre,
          quantity: i.quantity,
          price: i.price || i.precioVenta,
        })),
        subtotal: valorVenta,
        tax: igv,
        igv,
        taxRate: 18,
        total: totalConIGV,
        paymentMethod,
        amountPaid: paid,
        change: paymentMethod === 'EFECTIVO' ? paid - totalConIGV : 0,
        tipoComprobante,
        customer: selectedCustomer || { name: 'Cliente General' },
        businessInfo: settings,
        date: savedSale.date || savedSale.createdAt || new Date().toISOString(),
      });

      dispatch({
        type: 'COMPLETE_SALE',
        payload: {
          savedSale,
          paymentMethod,
          amountPaid: paid,
          customer: selectedCustomer || { name: 'Cliente General' },
        },
      });

      setShowPayment(false);
      setShowPostSale(true);
    } catch (e) {
      alert("Error procesando venta: " + (e.response?.data?.message || e.message));
    }
  };

  // Registro rápido de cliente
  const handleQuickRegister = async () => {
    if (!quickForm.name) return;
    if (quickForm.tipoDocumento === 'RUC' && quickForm.numeroDocumento.length !== 11) {
      alert('El RUC debe tener 11 dígitos');
      return;
    }
    if (quickForm.tipoDocumento === 'DNI' && quickForm.numeroDocumento && quickForm.numeroDocumento.length !== 8) {
      alert('El DNI debe tener 8 dígitos');
      return;
    }

    setRegisterLoading(true);
    try {
      const saved = await api.createCustomer({
        ...quickForm,
        clasificacion: quickForm.tipoCliente === 'EMPRESA' ? 'CORPORATIVO' : 'NUEVO',
      });
      dispatch({ type: 'ADD_CUSTOMER', payload: saved });
      dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: saved });

      // Auto-seleccionar tipo comprobante
      if (saved.tipoDocumento === 'RUC' || saved.tipoCliente === 'EMPRESA') {
        setTipoComprobante('FACTURA');
      }

      setShowQuickRegister(false);
      setQuickForm({ name: '', tipoDocumento: 'DNI', numeroDocumento: '', tipoCliente: 'PERSONA', razonSocial: '', phone: '', email: '', address: '' });
      setCustomerSearch('');
    } catch (e) {
      alert("Error registrando cliente: " + (e.response?.data?.message || e.message));
    } finally {
      setRegisterLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const change = paymentMethod === 'EFECTIVO' && amountPaid ? Number(amountPaid) - totalConIGV : 0;

  return (
    <div className="pos-page">
      {/* ====== LEFT: Products ====== */}
      <div className="pos-products">
        <div className="pos-products-header">
          <h1>Punto de Venta</h1>
          <div className="pos-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar producto, código o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pos-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="pos-products-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAddToCart}
              currency={settings.currency}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Search size={40} />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* ====== RIGHT: Cart ====== */}
      <div className="pos-cart">
        <div className="pos-cart-header">
          <ShoppingCart size={20} />
          <h2>Carrito</h2>
          <span className="cart-count">{cart.reduce((a, i) => a + i.quantity, 0)}</span>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'CLEAR_CART' })} style={{ marginLeft: 'auto' }}>
              <Trash2 size={14} /> Limpiar
            </button>
          )}
        </div>

        {/* Búsqueda de cliente por RUC/DNI */}
        <div style={{ padding: '0 12px', marginBottom: '6px' }}>
          <div className="pos-search" style={{ marginBottom: '4px' }}>
            <User size={16} />
            <input
              type="text"
              placeholder="Buscar cliente por RUC, DNI o nombre..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              style={{ fontSize: '0.8rem' }}
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowQuickRegister(true)}
              title="Registrar cliente rápido"
              style={{ padding: '2px 6px' }}
            >
              <UserPlus size={14} />
            </button>
          </div>

          {/* Dropdown de resultados */}
          {customerSearch && (
            <div style={{
              background: 'var(--color-bg-card2)', borderRadius: '0.5rem', border: '1px solid #2D2D44',
              maxHeight: '150px', overflowY: 'auto', marginBottom: '4px',
            }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, fontSize: '0.75rem' }}
                onClick={() => {
                  dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: null });
                  setTipoComprobante('BOLETA');
                  setCustomerSearch('');
                }}
              >
                Cliente General (sin documento)
              </button>
              {filteredCustomers.map(c => (
                <button
                  key={c.id}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, fontSize: '0.75rem' }}
                  onClick={() => {
                    dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: c });
                    if (c.tipoDocumento === 'RUC' || c.tipoCliente === 'EMPRESA') {
                      setTipoComprobante('FACTURA');
                    } else {
                      setTipoComprobante('BOLETA');
                    }
                    setCustomerSearch('');
                  }}
                >
                  {c.name || c.nombre} {c.numeroDocumento ? `(${c.tipoDocumento}: ${c.numeroDocumento})` : ''}
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Sin resultados.{' '}
                  <span style={{ color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => setShowQuickRegister(true)}>
                    Registrar nuevo cliente
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cliente seleccionado */}
          {selectedCustomer && !customerSearch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '4px 0' }}>
              <User size={14} style={{ color: 'var(--color-accent)' }} />
              <span style={{ flex: 1 }}>
                <strong>{selectedCustomer.name || selectedCustomer.nombre}</strong>
                {selectedCustomer.numeroDocumento && <span className="text-muted"> ({selectedCustomer.tipoDocumento}: {selectedCustomer.numeroDocumento})</span>}
              </span>
              <button className="cart-item-remove" onClick={() => {
                dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: null });
                setTipoComprobante('BOLETA');
              }}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Tipo de comprobante */}
        <div style={{ display: 'flex', gap: '6px', padding: '0 12px', marginBottom: '8px' }}>
          <Receipt size={16} style={{ color: 'var(--color-text-muted)', marginTop: '6px' }} />
          {['BOLETA', 'FACTURA', 'NOTA_VENTA'].map((tipo) => (
            <button
              key={tipo}
              className={`btn btn-sm ${tipoComprobante === tipo ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                if (tipo === 'FACTURA' && (!selectedCustomer || selectedCustomer.tipoDocumento !== 'RUC')) {
                  alert('Para Factura, seleccione un cliente con RUC');
                  return;
                }
                setTipoComprobante(tipo);
              }}
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              {tipo === 'BOLETA' ? 'Boleta' : tipo === 'FACTURA' ? 'Factura' : 'Nota de Venta'}
            </button>
          ))}
        </div>

        {/* Cart items */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={36} />
              <p>Carrito vacío</p>
              <span>Agrega productos para comenzar</span>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                onUpdateDiscount={handleUpdateDiscount}
                currency={settings.currency}
              />
            ))
          )}
        </div>

        {/* Summary */}
        {cart.length > 0 && (
          <div className="pos-cart-summary">
            <div className="summary-row">
              <span>Op. Gravada</span>
              <span>{formatCurrency(valorVenta, settings.currency)}</span>
            </div>
            <div className="summary-row">
              <span>IGV (18%)</span>
              <span>{formatCurrency(igv, settings.currency)}</span>
            </div>
            {descuentoTotal > 0 && (
              <div className="summary-row" style={{ color: 'var(--color-danger)' }}>
                <span>Descuento</span>
                <span>-{formatCurrency(descuentoTotal, settings.currency)}</span>
              </div>
            )}

            {/* Descuento global */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowGlobalDiscount(!showGlobalDiscount)}
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              >
                <Percent size={12} /> Desc. global
              </button>
              {showGlobalDiscount && (
                <>
                  <input
                    type="number"
                    value={globalDiscount}
                    onChange={(e) => dispatch({ type: 'SET_GLOBAL_DISCOUNT', payload: Number(e.target.value) })}
                    min="0" max="100" step="1"
                    style={{ width: '50px', padding: '2px 6px', fontSize: '0.75rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>%</span>
                </>
              )}
            </div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{formatCurrency(totalConIGV, settings.currency)}</span>
            </div>
            <button className="btn btn-success btn-lg checkout-btn" onClick={handleCheckout}>
              <CreditCard size={20} /> Cobrar {formatCurrency(totalConIGV, settings.currency)}
            </button>
          </div>
        )}
      </div>

      {/* ====== MODAL: Pago ====== */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Procesar Pago">
        <div className="payment-total">
          <span>Total a cobrar</span>
          <span className="payment-amount">{formatCurrency(totalConIGV, settings.currency)}</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <span className="category-tag" style={{ fontSize: '0.85rem' }}>
            {tipoComprobante === 'BOLETA' ? 'Boleta de Venta' : tipoComprobante === 'FACTURA' ? 'Factura' : 'Nota de Venta'}
          </span>
          {selectedCustomer && (
            <span style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              {selectedCustomer.name || selectedCustomer.nombre}
              {selectedCustomer.numeroDocumento && ` — ${selectedCustomer.tipoDocumento}: ${selectedCustomer.numeroDocumento}`}
            </span>
          )}
        </div>

        <div className="payment-methods">
          {METODOS_PAGO.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`payment-method-btn ${paymentMethod === key ? 'active' : ''}`}
              onClick={() => setPaymentMethod(key)}
            >
              <Icon size={24} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {paymentMethod === 'EFECTIVO' && (
          <div className="payment-cash">
            <div className="form-group">
              <label>Monto recibido</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                min={totalConIGV}
                step="0.01"
                autoFocus
              />
            </div>
            {amountPaid && Number(amountPaid) >= totalConIGV && (
              <div className="payment-change">
                <span>Vuelto:</span>
                <span className="change-amount">{formatCurrency(change, settings.currency)}</span>
              </div>
            )}
            <div className="quick-amounts">
              {[10, 20, 50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  className="btn btn-ghost btn-sm"
                  onClick={() => setAmountPaid(String(amt))}
                >
                  {formatCurrency(amt, settings.currency)}
                </button>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => setAmountPaid(String(Math.ceil(totalConIGV)))}>
                Exacto
              </button>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setShowPayment(false)}>Cancelar</button>
          <button
            className="btn btn-success btn-lg"
            onClick={handleCompleteSale}
            disabled={paymentMethod === 'EFECTIVO' && (!amountPaid || Number(amountPaid) < totalConIGV)}
          >
            <CheckCircle size={18} /> Completar Venta
          </button>
        </div>
      </Modal>

      {/* ====== MODAL: Post-venta (comprobante) ====== */}
      <Modal isOpen={showPostSale} onClose={() => setShowPostSale(false)} title="Venta Completada" size="lg">
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <CheckCircle size={36} style={{ color: 'var(--color-success)' }} />
          <h3 style={{ margin: '8px 0 4px', color: 'var(--color-success)' }}>¡Venta registrada exitosamente!</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {lastSaleData?.invoiceNumber}
          </p>
        </div>

        <InvoicePreview sale={lastSaleData} />

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </button>
          {lastSaleData?.customer?.email && (
            <button className="btn btn-ghost" onClick={() => alert('Envío por email se implementará con el módulo de facturación electrónica')}>
              <Mail size={16} /> Enviar por Email
            </button>
          )}
          <button className="btn btn-success" onClick={() => setShowPostSale(false)}>
            Nueva Venta
          </button>
        </div>
      </Modal>

      {/* ====== MODAL: Registro rápido de cliente ====== */}
      <Modal isOpen={showQuickRegister} onClose={() => setShowQuickRegister(false)} title="Registro Rápido de Cliente">
        <div className="form-group">
          <label>Tipo de Cliente</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${quickForm.tipoCliente === 'PERSONA' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setQuickForm({ ...quickForm, tipoCliente: 'PERSONA', tipoDocumento: 'DNI' })}
              style={{ flex: 1 }}
            >
              <User size={14} /> Persona
            </button>
            <button
              className={`btn ${quickForm.tipoCliente === 'EMPRESA' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setQuickForm({ ...quickForm, tipoCliente: 'EMPRESA', tipoDocumento: 'RUC' })}
              style={{ flex: 1 }}
            >
              <Building2 size={14} /> Empresa
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo Documento</label>
            <select value={quickForm.tipoDocumento} onChange={(e) => setQuickForm({ ...quickForm, tipoDocumento: e.target.value })}>
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">Carné Extranjería</option>
            </select>
          </div>
          <div className="form-group">
            <label>N° Documento</label>
            <input
              value={quickForm.numeroDocumento}
              onChange={(e) => setQuickForm({ ...quickForm, numeroDocumento: e.target.value.replace(/\D/g, '') })}
              placeholder={quickForm.tipoDocumento === 'RUC' ? '20XXXXXXXXX' : 'XXXXXXXX'}
              maxLength={quickForm.tipoDocumento === 'RUC' ? 11 : 8}
            />
          </div>
        </div>

        <div className="form-group">
          <label>{quickForm.tipoCliente === 'EMPRESA' ? 'Nombre Comercial' : 'Nombre Completo'} *</label>
          <input
            value={quickForm.name}
            onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
            placeholder={quickForm.tipoCliente === 'EMPRESA' ? 'Nombre comercial' : 'Nombre completo'}
            autoFocus
          />
        </div>

        {quickForm.tipoCliente === 'EMPRESA' && (
          <div className="form-group">
            <label>Razón Social</label>
            <input
              value={quickForm.razonSocial}
              onChange={(e) => setQuickForm({ ...quickForm, razonSocial: e.target.value })}
              placeholder="Razón social según SUNAT"
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Teléfono</label>
            <input value={quickForm.phone} onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })} placeholder="999 999 999" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={quickForm.email} onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })} placeholder="correo@email.com" />
          </div>
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input value={quickForm.address} onChange={(e) => setQuickForm({ ...quickForm, address: e.target.value })} placeholder="Dirección fiscal" />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => setShowQuickRegister(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleQuickRegister} disabled={registerLoading || !quickForm.name}>
            {registerLoading ? 'Guardando...' : 'Registrar y Seleccionar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
