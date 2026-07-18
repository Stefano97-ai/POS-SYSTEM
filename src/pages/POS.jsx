// CAMBIO N°7: Atajos de teclado F1, F2, F12/Ctrl+Enter, Esc
// CAMBIO N°8: Contador "Mostrando X de Y productos"
// CAMBIO N°2: Pasar stockDisponible y cartQuantity al CartItem y ProductCard
// CAMBIO N°6: Tooltip en Nota de Venta
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ShoppingCart, Trash2, Receipt, Info } from 'lucide-react';
import CartItem from '../components/CartItem';
import ProductSearchPanel from '../components/pos/ProductSearchPanel';
import CustomerSearch from '../components/pos/CustomerSearch';
import CartSummary from '../components/pos/CartSummary';
import POSPaymentModal from '../components/pos/PaymentModal';
import PostSaleModal from '../components/pos/PostSaleModal';
import Modal from '../components/Modal';

export default function POS() {
  const { state, dispatch } = useApp();
  const { products, cart, settings, selectedCustomer, globalDiscount } = state;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showPayment, setShowPayment] = useState(false);
  const [showPostSale, setShowPostSale] = useState(false);
  const [lastSaleData, setLastSaleData] = useState(null);
  const [tipoComprobante, setTipoComprobante] = useState('BOLETA');
  const [alertMessage, setAlertMessage] = useState('');

  // CAMBIO N°7: Referencias para atajos de teclado
  const searchProductRef = useRef(null);
  const searchCustomerRef = useRef(null);

  const categories = ['Todos', ...state.categories.map((c) => (typeof c === 'string' ? c : c.nombre))];

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      p.barcode.toLowerCase().includes(term) ||
      (p.modelo || '').toLowerCase().includes(term);
    const matchCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  // Cálculos IGV (precio de venta YA incluye IGV en Perú)
  const precioVentaTotal = cart.reduce((sum, item) => {
    const lineTotal = item.price * (item.quantity || 0);
    return sum + lineTotal - (lineTotal * (item.discount || 0) / 100);
  }, 0);
  const descuentoGlobal = precioVentaTotal * (globalDiscount / 100);
  const totalConIGV = precioVentaTotal - descuentoGlobal;
  const valorVenta = totalConIGV / 1.18;
  const igv = totalConIGV - valorVenta;
  const descuentoItems = cart.reduce((sum, item) => {
    const lineTotal = item.price * (item.quantity || 0);
    return sum + lineTotal * (item.discount || 0) / 100;
  }, 0);
  const descuentoTotal = descuentoItems + descuentoGlobal;

  // CAMBIO N°2: Validación de stock con mensaje claro
  const handleAddToCart = (product) => {
    if (product.stock <= 0) return;
    const inCart = cart.find((i) => i.id === product.id);
    if (inCart && inCart.quantity >= product.stock) {
      // No usar alert() — el botón ya estará deshabilitado visualmente
      return;
    }
    // CAMBIO N°2: Incluir stock disponible en el item del carrito
    dispatch({ type: 'ADD_TO_CART', payload: { ...product, stock: product.stock } });
  };

  const handleUpdateQuantity = (id, quantity) => {
    const product = products.find((p) => p.id === id);
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: id });
      return;
    }
    if (product && quantity > product.stock) {
      return; // Bloqueado silenciosamente (el botón "+" ya está deshabilitado)
    }
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity } });
  };

  const handleQuickRegister = async (formData) => {
    const saved = await api.createCustomer({
      ...formData,
      clasificacion: formData.tipoCliente === 'EMPRESA' ? 'CORPORATIVO' : 'NUEVO',
    });
    dispatch({ type: 'ADD_CUSTOMER', payload: saved });
    return saved;
  };

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    if (tipoComprobante === 'FACTURA' && (!selectedCustomer || selectedCustomer.tipoDocumento !== 'RUC')) {
      alert('Para emitir una Factura, debe seleccionar un cliente con RUC.');
      return;
    }
    setShowPayment(true);
  }, [cart.length, tipoComprobante, selectedCustomer]);

  const handleCompleteSale = async (paymentMethod, paid) => {
    try {
      const saleData = {
        clienteId: selectedCustomer?.id || null,
        tipoComprobante,
        metodoPago: paymentMethod,
        montoPagado: paid,
        descuentoGlobal,
        items: cart.map((i) => ({ productoId: i.id, cantidad: i.quantity, descuento: i.discount || 0 })),
      };

      const savedSale = await api.createSale(saleData);

      setLastSaleData({
        ...savedSale,
        invoiceNumber: savedSale.invoiceNumber || savedSale.numeroVenta || savedSale.numeroComprobante,
        items: savedSale.items || savedSale.detalles || cart.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
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
        payload: { savedSale, paymentMethod, amountPaid: paid, customer: selectedCustomer || { name: 'Cliente General' } },
      });

      setShowPayment(false);
      setShowPostSale(true);
    } catch (e) {
      alert('Error procesando venta: ' + (e.response?.data?.message || e.message));
    }
  };

  // CAMBIO N°7: Atajos de teclado globales
  const handleKeyDown = useCallback((e) => {
    // F1 → Enfocar buscador de producto
    if (e.key === 'F1') {
      e.preventDefault();
      searchProductRef.current?.focus();
    }
    // F2 → Enfocar buscador de cliente
    if (e.key === 'F2') {
      e.preventDefault();
      searchCustomerRef.current?.focus();
    }
    // F12 o Ctrl+Enter → Procesar cobro
    if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
      e.preventDefault();
      if (cart.length > 0) handleCheckout();
    }
    // Esc → Limpiar carrito (con confirmación)
    if (e.key === 'Escape' && cart.length > 0) {
      if (window.confirm('¿Deseas limpiar el carrito?')) {
        dispatch({ type: 'CLEAR_CART' });
      }
    }
  }, [cart, handleCheckout, dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // CAMBIO N°2: Mapa de cantidades en carrito para pasar a las cards
  const cartQtyMap = cart.reduce((acc, item) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {});

  return (
    <div className="pos-premium-layout">
      {/* CAMBIO N°7: Pasar ref del buscador al panel */}
      <ProductSearchPanel
        products={filteredProducts}
        totalProducts={products.filter(p => activeCategory === 'Todos' || p.category === activeCategory).length}
        categories={categories}
        activeCategory={activeCategory}
        search={search}
        onSearchChange={setSearch}
        onCategoryChange={setActiveCategory}
        onAddToCart={handleAddToCart}
        currency={settings.currency}
        searchRef={searchProductRef}
        cartQtyMap={cartQtyMap}
      />

      <div className="pos-cart-panel">
        <div className="cart-header-premium">
          <h2><ShoppingCart size={20} /> Carrito <span className="cart-badge">{cart.reduce((a, i) => a + i.quantity, 0)}</span></h2>
          {cart.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { if (window.confirm('¿Limpiar el carrito?')) dispatch({ type: 'CLEAR_CART' }); }}
              title="Limpiar carrito (Esc)"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* CAMBIO N°7: Pasar ref del buscador de cliente */}
        <CustomerSearch
          onSetTipoComprobante={setTipoComprobante}
          onQuickRegister={handleQuickRegister}
          searchRef={searchCustomerRef}
        />

        {/* Selector de tipo de comprobante (Segmented Control) */}
        <div className="segmented-control">
          {['BOLETA', 'FACTURA', 'NOTA_VENTA'].map((tipo) => (
            <button
              key={tipo}
              className={`segmented-btn ${tipoComprobante === tipo ? 'active' : ''}`}
              onClick={() => {
                if (tipo === 'FACTURA' && (!selectedCustomer || selectedCustomer.tipoDocumento !== 'RUC')) {
                  setAlertMessage('Para emitir una Factura, debe seleccionar un cliente que tenga RUC (empresa).');
                  return;
                }
                setTipoComprobante(tipo);
              }}
            >
              {tipo === 'BOLETA' ? 'Boleta' : tipo === 'FACTURA' ? 'Factura' : 'Nota Venta'}
            </button>
          ))}
        </div>

        {/* CAMBIO N°7: Atajos de teclado visibles */}
        <div style={{ padding: '0 12px 10px', fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)', justifyContent: 'center' }}>
          <span style={{background: 'var(--color-bg-dark)', padding: '2px 6px', borderRadius: '4px'}}>F1: Buscar</span>
          <span style={{background: 'var(--color-bg-dark)', padding: '2px 6px', borderRadius: '4px'}}>F2: Cliente</span>
          <span style={{background: 'var(--color-bg-dark)', padding: '2px 6px', borderRadius: '4px'}}>F12: Cobrar</span>
        </div>

        <div className="cart-items-container">
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
                onRemove={(id) => dispatch({ type: 'REMOVE_FROM_CART', payload: id })}
                onUpdateDiscount={(id, discount) => dispatch({ type: 'UPDATE_CART_DISCOUNT', payload: { id, discount } })}
                currency={settings.currency}
              />
            ))
          )}
        </div>

        {cart.length > 0 && (
          <CartSummary
            valorVenta={valorVenta}
            igv={igv}
            descuentoTotal={descuentoTotal}
            total={totalConIGV}
            onCheckout={handleCheckout}
            currency={settings.currency}
          />
        )}
      </div>

      <POSPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        total={totalConIGV}
        tipoComprobante={tipoComprobante}
        selectedCustomer={selectedCustomer}
        onComplete={handleCompleteSale}
        currency={settings.currency}
      />

      <PostSaleModal
        isOpen={showPostSale}
        onClose={() => setShowPostSale(false)}
        sale={lastSaleData}
      />

      {/* Modal de Alerta Profesional */}
      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage('')} title="Aviso" size="sm">
        <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
          <Info size={48} color="#F59E0B" style={{ marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            {alertMessage}
          </p>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1.05rem', borderRadius: '0.75rem' }} 
            onClick={() => setAlertMessage('')}
            autoFocus
          >
            Entendido
          </button>
        </div>
      </Modal>
    </div>
  );
}
