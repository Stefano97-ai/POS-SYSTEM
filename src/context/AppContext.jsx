import { createContext, useContext, useReducer, useEffect } from 'react';
import { defaultCategories, defaultSettings, defaultProducts, defaultCustomers } from '../utils/seedData';
import { api } from '../utils/api';

const AppContext = createContext();

const initialState = {
  products: [],
  categories: defaultCategories,
  customers: [],
  suppliers: [],
  sales: [],
  cart: [],
  settings: defaultSettings,
  selectedCustomer: null,
  globalDiscount: 0, // porcentaje de descuento global
  loading: true,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        ...action.payload,
        loading: false,
      };

    // ===== CART =====
    case 'ADD_TO_CART': {
      const product = action.payload;
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, { ...product, quantity: 1, discount: 0 }] };
    }

    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((item) => item.id !== action.payload) };

    case 'UPDATE_CART_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, cart: state.cart.filter((item) => item.id !== id) };
      }
      return {
        ...state,
        cart: state.cart.map((item) => (item.id === id ? { ...item, quantity } : item)),
      };
    }

    case 'UPDATE_CART_DISCOUNT': {
      const { id, discount } = action.payload;
      return {
        ...state,
        cart: state.cart.map((item) => (item.id === id ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item)),
      };
    }

    case 'SET_GLOBAL_DISCOUNT':
      return { ...state, globalDiscount: Math.min(100, Math.max(0, action.payload)) };

    case 'CLEAR_CART':
      return { ...state, cart: [], selectedCustomer: null, globalDiscount: 0 };

    case 'SET_SELECTED_CUSTOMER':
      return { ...state, selectedCustomer: action.payload };

    // ===== SALES =====
    case 'COMPLETE_SALE': {
      const { customer, savedSale } = action.payload;

      const total = savedSale.total || action.payload.amountPaid;

      const updatedProducts = state.products.map((product) => {
        const cartItem = state.cart.find((item) => item.id === product.id);
        if (cartItem) {
          return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
        }
        return product;
      });

      const updatedCustomers = state.customers.map((c) => {
        if (customer && c.id === customer.id) {
          return { ...c, totalPurchases: (c.totalPurchases || 0) + total };
        }
        return c;
      });

      return {
        ...state,
        sales: [savedSale, ...state.sales],
        products: updatedProducts,
        customers: updatedCustomers,
        cart: [],
        selectedCustomer: null,
        globalDiscount: 0,
      };
    }

    case 'ADD_SALE':
      return { ...state, sales: [action.payload, ...state.sales] };

    case 'UPDATE_SALE': {
      const updated = action.payload;
      return {
        ...state,
        sales: state.sales.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
      };
    }

    // ===== PRODUCTS =====
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };

    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.payload) };

    // ===== CUSTOMERS =====
    case 'ADD_CUSTOMER':
      return {
        ...state,
        customers: [...state.customers, action.payload],
      };

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };

    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter((c) => c.id !== action.payload) };

    // ===== SUPPLIERS =====
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };

    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };

    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.payload) };

    // ===== SETTINGS =====
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    // ===== CATEGORIES =====
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    // ===== RESET =====
    case 'RESET_DATA':
      return {
        ...initialState,
        products: defaultProducts,
        categories: defaultCategories,
        customers: defaultCustomers,
        sales: [],
        cart: [],
        settings: defaultSettings,
        selectedCustomer: null,
        globalDiscount: 0,
        loading: false,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, customersRes, salesRes, settings, suppliers] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getSales(),
          api.getSettings(),
          api.getProveedores()
        ]);

        // Extract .content from paginated responses
        const products = Array.isArray(productsRes) ? productsRes : (productsRes?.content || []);
        const customers = Array.isArray(customersRes) ? customersRes : (customersRes?.content || []);
        const sales = Array.isArray(salesRes) ? salesRes : (salesRes?.content || []);

        let categories = defaultCategories;
        try {
          const backendCategorias = await api.getCategorias();
          if (Array.isArray(backendCategorias) && backendCategorias.length > 0) {
            categories = backendCategorias; // store full objects {id, nombre}
          }
        } catch {
          // fallback to string array
        }

        dispatch({
          type: 'INITIALIZE',
          payload: { products, customers, sales, settings, categories, suppliers: Array.isArray(suppliers) ? suppliers : (suppliers?.content || []) }
        });
      } catch (error) {
        console.error('Error cargando datos del Backend:', error);
        dispatch({
          type: 'INITIALIZE',
          payload: {
            products: [],
            customers: [],
            sales: [],
            settings: defaultSettings,
            categories: defaultCategories,
            suppliers: [],
          },
        });
      }
    };
    loadData();
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
