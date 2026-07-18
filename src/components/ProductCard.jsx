// CAMBIO N°3: Indicador de stock con colores (verde/naranja/rojo)
// CAMBIO N°3: Card deshabilitada + badge AGOTADO cuando stock = 0
// CAMBIO N°2: El stock se pasa al carrito para validación en CartItem
import { Plus } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function ProductCard({ product, onAdd, currency = 'S/.', cartQuantity = 0 }) {
  const isOutOfStock = product.stock <= 0;
  // CAMBIO N°2: Verificar si ya se agregó el máximo al carrito
  const isMaxInCart = cartQuantity >= product.stock && product.stock > 0;

  // CAMBIO N°3: Color del stock según nivel
  const getStockColor = (stock) => {
    if (stock <= 0) return '#DC2626';      // Rojo - Agotado
    if (stock <= 5) return '#F59E0B';      // Naranja - Stock bajo
    return '#10B981';                       // Verde - OK
  };

  const stockColor = getStockColor(product.stock);

  return (
    <div
      className={`product-card-premium ${isOutOfStock ? 'disabled' : ''}`}
      onClick={() => !isOutOfStock && !isMaxInCart && onAdd(product)}
      title={
        isOutOfStock
          ? 'Sin stock disponible'
          : isMaxInCart
          ? `Ya tienes las ${product.stock} unidades en el carrito`
          : 'Clic para agregar'
      }
    >
      <div className={`product-badge-stock ${product.stock <= 0 ? 'out' : product.stock <= 5 ? 'low' : ''}`}>
        {isOutOfStock ? 'AGOTADO' : `Stock: ${product.stock}`}
      </div>

      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        background: 'linear-gradient(135deg, rgba(4, 120, 87, 0.1), rgba(4, 120, 87, 0.05))',
        border: '1px solid rgba(4, 120, 87, 0.1)'
      }}>
        {getCategoryEmoji(product.category)}
      </div>

      <div>
        <h4 className="product-card-title">{product.name}</h4>
        <div className="product-card-price">{formatCurrency(product.price, currency)}</div>
      </div>
    </div>
  );
}

function getCategoryEmoji(category) {
  const emojis = {
    'Maletas': '🧳',
    'Bolsos de Mano': '👜',
    'Mochilas Escolares': '🎒',
    'Bolsos Ejecutivos': '💼',
    'Talabartería': '🪡',
    'Máquinas Textiles': '🏭',
    'Repuestos': '🔧',
  };
  return emojis[category] || '📦';
}
