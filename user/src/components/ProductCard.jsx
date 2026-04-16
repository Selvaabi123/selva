import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart!`);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <Link to={`/products/${product.id}`} className="card group overflow-hidden hover:shadow-md transition-all">
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        <img src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
          alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
          <span className="text-brand-600 font-bold text-sm whitespace-nowrap">₹{parseFloat(product.price).toFixed(0)}</span>
        </div>
        {product.category && <p className="text-gray-400 text-xs mb-3">{product.category}</p>}
        <button onClick={handleAdd} className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-1">
          <Plus className="w-3 h-3" /> Add to Cart
        </button>
      </div>
    </Link>
  );
}
