// CAMBIO N°7: Recibe searchRef para atajo F1
// CAMBIO N°8: Contador "Mostrando X de Y productos"
// CAMBIO N°2: Pasa cartQuantity a cada ProductCard
import { Search } from 'lucide-react';
import ProductCard from '../ProductCard';

export default function ProductSearchPanel({
  products,
  totalProducts,
  categories,
  activeCategory,
  search,
  onSearchChange,
  onCategoryChange,
  onAddToCart,
  currency,
  searchRef,
  cartQtyMap = {},
}) {
  return (
    <div className="pos-catalog-panel">
      
      <div className="pos-topbar">
        <div className="pos-title-area">
          <h1>Punto de Venta</h1>
          <span>Mostrando {products.length} de {totalProducts} productos</span>
        </div>
        
        <div className="pos-search-bar">
          <Search size={18} color="var(--color-text-muted)" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar producto, código o modelo... (F1)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="pos-category-pills">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="pos-product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={onAddToCart}
            currency={currency}
            cartQuantity={cartQtyMap[product.id] || 0}
          />
        ))}
        {products.length === 0 && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--color-text-muted)', gap: '1rem' }}>
            <Search size={48} opacity={0.2} />
            <p style={{fontSize: '1.1rem'}}>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
