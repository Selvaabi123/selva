import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Flame, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const quantity = getItemQuantity(product.id);
  
  const mrp = Math.round(product.price * 1.2);
  const discount = mrp - product.price;
  const discountPercent = discount > 0 ? Math.round((discount / mrp) * 100) : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (loading || product.stock <= 0) return;
    setLoading(true);
    try {
      await addToCart(product.id, 1);
      toast.success(`Added to cart!`, { icon: '🛒' });
    } catch {
      toast.error('Failed to add');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (delta, e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await updateQuantity(product.id, quantity + delta);
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link 
      to={`/products/${product.id}`} 
      className="block flex-shrink-0 transition-transform duration-200"
      style={{ width: '150px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        bg-white rounded-2xl overflow-hidden
        ${isHovered ? 'shadow-lg ring-2 ring-orange-100' : 'shadow-sm'}
        transition-all duration-200 hover:-translate-y-1
        border border-gray-100
      `}>
        {/* Image Container */}
        <div className="relative h-28 bg-gray-50">
          <img 
            src={product.image_url || `https://picsum.photos/seed/${product.id}/200`} 
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
          
          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white bg-orange-500">
                {discountPercent}% OFF
              </span>
            </div>
          )}
          
          {/* Fast Delivery Badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-[9px] font-medium text-orange-600">10 min</span>
          </div>
          
          {/* Out of Stock Overlay */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-xs font-bold px-2 py-1 bg-gray-800 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-2.5">
          {/* Category/Weight */}
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">
            {product.category || '500g'}
          </p>
          
          {/* Product Name - Max 2 lines */}
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1" style={{ minHeight: '2.6em' }}>
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-medium text-gray-600">4.5</span>
          </div>
          
          {/* Pricing */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-base font-bold text-gray-900">₹{product.price}</span>
            {discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
            )}
          </div>
          
          {/* Add Button / Stepper */}
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-orange-500 rounded-lg h-8 overflow-hidden">
              <button 
                onClick={(e) => handleUpdate(-1, e)} 
                disabled={loading}
                className="w-8 h-full flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              <span className="flex-1 text-center text-white font-bold text-sm">
                {quantity}
              </span>
              <button 
                onClick={(e) => handleUpdate(1, e)} 
                disabled={loading}
                className="w-8 h-full flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleAdd} 
              disabled={loading || product.stock <= 0}
              className={`
                w-full h-8 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5
                transition-all duration-200 active:scale-95
                ${product.stock <= 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg'
                }
              `}
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
