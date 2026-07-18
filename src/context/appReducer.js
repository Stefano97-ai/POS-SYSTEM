import { normalizeProduct } from '../utils/helpers';
import { defaultCategories, defaultSettings, defaultProducts, defaultCustomers } from '../utils/seedData';

export const initialState = {
  products: [],
  categories: defaultCategories,
  customers: [],
  suppliers: [],
  sales: [],
  cart: [],
  settings: defaultSettings,
  selectedCustomer: null,
  globalDiscount: 0,
  loading: true,
};

export function appReducer(state, action) {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, ...action.payload, loading: false };

    // ===== CART =====
    case 'ADD_TO_CART': {
      const product = action.payload;
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return { ...state, cart: state.cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) };
      }
      return { ...state, cart: [...state.cart, { ...product, quantity: 1, discount: 0 }] };
    }

    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((item) => item.id !== action.payload) };

    case 'UPDATE_CART_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) return { ...state, cart: state.cart.filter((item) => item.id !== id) };
      return { ...state, cart: state.cart.map((item) => (item.id === id ? { ...item, quantity } : item)) };
    }

    case 'UPDATE_CART_DISCOUNT': {
      const { id, discount } = action.payload;
      return { ...state, cart: state.cart.map((item) => (item.id === id ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item)) };
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
        return cartItem ? { ...product, stock: Math.max(0, product.stock - cartItem.quantity) } : product;
      });
      const updatedCustomers = state.customers.map((c) =>
        customer && c.id === customer.id ? { ...c, totalPurchases: (c.totalPurchases || 0) + total } : c
      );
      return { ...state, sales: [savedSale, ...state.sales], products: updatedProducts, customers: updatedCustomers, cart: [], selectedCustomer: null, globalDiscount: 0 };
    }

    case 'ADD_SALE':
      return { ...state, sales: [action.payload, ...state.sales] };

    case 'UPDATE_SALE': {
      const updated = action.payload;
      return { ...state, sales: state.sales.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)) };
    }

    // ===== PRODUCTS =====
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, normalizeProduct(action.payload)] };

    case 'UPDATE_PRODUCT':
      return { ...state, products: state.products.map((p) => p.id === action.payload.id ? normalizeProduct({ ...p, ...action.payload }) : p) };

    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.payload) };

    // ===== CUSTOMERS =====
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };

    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map((c) => (c.id === action.payload.id ? action.payload : c)) };

    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter((c) => c.id !== action.payload) };

    // ===== SUPPLIERS =====
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };

    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map((s) => (s.id === action.payload.id ? action.payload : s)) };

    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.payload) };

    // ===== SETTINGS =====
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    // ===== RESET =====
    case 'RESET_DATA':
      return { ...initialState, products: defaultProducts, categories: defaultCategories, customers: defaultCustomers, sales: [], cart: [], settings: defaultSettings, selectedCustomer: null, globalDiscount: 0, loading: false };

    default:
      return state;
  }
}
