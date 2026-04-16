import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function Cart() {
  const { items, total, updateItem, removeItem, fetchCart } = useCart();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (productId, name) => {
    removeItem(productId);
    toast.success(`${name} removed`);
  };

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center page-enter">
      <div className="text-7xl mb-6">🛒</div>
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
      <p className="text-gray-400 mb-8">Add some delicious items from our menu!</p>
      <Link to="/products" className="btn-primary inline-flex items-center gap-2">
        <ShoppingBag className="w-4 h-4" /> Browse Menu
      </Link>
    </div>
  );

  const deliveryFee = 50;
  const grandTotal = parseFloat(total) + deliveryFee;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Your Cart ({items.length} items)</h1>
      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-3">
          {items.map(item => (
            <div key={item.product_id} className="card p-4 flex gap-4 items-center">
              <img src={item.product?.image_url || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                alt={item.product?.name || item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'; }} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.product?.name || item.name}</h3>
                <p className="text-brand-600 font-bold">₹{parseFloat(item.product?.price || item.price).toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateItem(item.product_id, (item.quantity || item.qty) - 1)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-bold text-sm">{item.quantity || item.qty}</span>
                <button onClick={() => updateItem(item.product_id, (item.quantity || item.qty) + 1)}
                  className="w-8 h-8 rounded-lg bg-brand-500 text-white hover:bg-brand-600 flex items-center justify-center transition">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-right min-w-[70px]">
                <p className="font-bold text-gray-900">₹{((parseFloat(item.product?.price || item.price)) * (item.quantity || item.qty)).toFixed(0)}</p>
                <button onClick={() => handleRemove(item.product_id, item.product?.name || item.name)}
                  className="text-red-400 hover:text-red-600 mt-1 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2">
          <div className="card p-6 sticky top-20">
            <h2 className="font-display font-bold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Order Value</span>
                <span>₹{parseFloat(total).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between font-bold text-base">
                <span>Total to Pay</span>
                <span className="text-brand-600">₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/products" className="btn-ghost w-full text-center mt-2 block text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
