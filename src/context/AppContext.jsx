/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect } from 'react';
import { defaultCategories, defaultSettings } from '../utils/seedData';
import { api } from '../services/api';
import { normalizeProduct } from '../utils/helpers';
import { appReducer, initialState } from './appReducer';
import { cacheProducts, getCachedProducts, saveConfig } from '../utils/offlineDB';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      // Guardar token en IndexedDB para Background Sync del SW
      const token = localStorage.getItem('pos_token');
      if (token) saveConfig('pos_token', token).catch(() => {});

      try {
        console.log('DEBUG: Cargando datos del backend...');
        const [productsRes, customersRes, salesRes, settings, suppliers] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getSales(),
          api.getSettings(),
          api.getProveedores(),
        ]);

        console.log('DEBUG: Productos recibidos:', productsRes?.length || productsRes?.content?.length || 0);
        const products = (Array.isArray(productsRes) ? productsRes : (productsRes?.content || [])).map(normalizeProduct);
        const customers = Array.isArray(customersRes) ? customersRes : (customersRes?.content || []);
        const sales = Array.isArray(salesRes) ? salesRes : (salesRes?.content || []);

        // Cachear productos en IndexedDB para uso offline
        if (products.length > 0) {
          cacheProducts(products).catch(() => {});
        }

        let categories = defaultCategories;
        try {
          const backendCategorias = await api.getCategorias();
          if (Array.isArray(backendCategorias) && backendCategorias.length > 0) {
            categories = backendCategorias;
          }
        } catch { /* fallback */ }

        // Persistence: Load from localStorage
        const savedCart = JSON.parse(localStorage.getItem('pos_cart') || '[]');
        const savedCustomer = JSON.parse(localStorage.getItem('pos_customer') || 'null');

        dispatch({
          type: 'INITIALIZE',
          payload: { 
            products, customers, sales, settings, categories, 
            suppliers: Array.isArray(suppliers) ? suppliers : (suppliers?.content || []),
            cart: savedCart,
            selectedCustomer: savedCustomer
          },
        });

      } catch {
        console.warn('Backend no disponible — cargando datos desde caché offline...');
        
        // MODO OFFLINE: intentar cargar productos cacheados
        try {
          const cachedProducts = await getCachedProducts();
          const savedCart = JSON.parse(localStorage.getItem('pos_cart') || '[]');
          const savedCustomer = JSON.parse(localStorage.getItem('pos_customer') || 'null');

          dispatch({
            type: 'INITIALIZE',
            payload: {
              products: cachedProducts,
              customers: [],
              sales: [],
              settings: defaultSettings,
              categories: defaultCategories,
              suppliers: [],
              cart: savedCart,
              selectedCustomer: savedCustomer,
              isOffline: true,
            },
          });

          if (cachedProducts.length > 0) {
            console.log(`Modo offline: ${cachedProducts.length} productos cargados desde caché`);
          }
        } catch (cacheError) {
          console.error('Error cargando caché offline:', cacheError);
          dispatch({
            type: 'INITIALIZE',
            payload: { products: [], customers: [], sales: [], settings: defaultSettings, categories: defaultCategories, suppliers: [] },
          });
        }
      }
    };
    loadData();
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (state.loading) return;
    localStorage.setItem('pos_cart', JSON.stringify(state.cart));
    localStorage.setItem('pos_customer', JSON.stringify(state.selectedCustomer));
  }, [state.cart, state.selectedCustomer, state.loading]);


  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export default AppContext;
