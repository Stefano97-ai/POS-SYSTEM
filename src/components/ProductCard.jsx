import { Plus } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function ProductCard({ product, onAdd, currency = 'S/.' }) {
  const isOutOfStock = product.stock <= 0;
  const nombre = product.nombre || product.name || '';
  const precio = product.precioVenta || product.price || 0;
  const categoria = product.categoriaNombre || product.category || '';

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-card-emoji">
        {getCategoryEmoji(categoria)}
      </div>
      <div className="product-card-info">
        <h4 className="product-card-name">{nombre}</h4>
        <span className="product-card-category">{categoria}</span>
      </div>
      <div className="product-card-bottom">
        <span className="product-card-price">{formatCurrency(precio, currency)}</span>
        <span className="product-card-stock">Stock: {product.stock}</span>
      </div>
      <button
        className="product-card-add"
        onClick={() => onAdd(product)}
        disabled={isOutOfStock}
        title={isOutOfStock ? 'Sin stock' : 'Agregar al carrito'}
      >
        <Plus size={18} />
      </button>
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
