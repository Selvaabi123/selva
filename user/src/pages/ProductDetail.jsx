import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Minus, Package, ShoppingBag } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, updateItem, items } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`).then(r => setProduct(r.data.product)).finally(() => setLoading(false));
  }, [id]);

  const cartItem = items.find(i => i.product_id === parseInt(id));
  const cartQty = cartItem?.quantity || 0;

  const handleAdd = async () => {
    if (!user) { toast.error('Please login'); return; }
    if (user.role !== 'user') { toast.error('Only customers can order'); return; }
    try {
      setAdding(true);
      await addToCart(product.id, qty);
      toast.success('Added to cart!');
    } catch { toast.error('Failed'); } finally { setAdding(false); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card animate-pulse">
        <div className="grid md:grid-cols-2">
          <div className="aspect-square bg-gray-200" />
          <div className="p-8 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
      <h2 className="font-display text-xl font-bold text-gray-700">Product not found</h2>
      <Link to="/products" className="btn-primary mt-4 inline-block">Back to Menu</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>
      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="aspect-square md:aspect-auto overflow-hidden bg-gray-50">
            <img src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
              alt={product.name} className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'; }} />
          </div>
          <div className="p-6 md:p-8 flex flex-col">
            {product.category_name && (
              <span className="badge bg-brand-100 text-brand-700 mb-3 self-start">{product.category_name}</span>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <p className="text-gray-500 mb-6 leading-relaxed flex-1">{product.description}</p>

            <div className="flex items-center gap-3 mb-6">
              <Package className="w-4 h-4 text-gray-400" />
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="font-display text-3xl font-bold text-brand-600">₹{parseFloat(product.price).toFixed(0)}</span>
              <span className="text-gray-400 text-sm">per serving</span>
            </div>

            {product.stock > 0 && user?.role === 'user' && (
              <div className="space-y-4">
                {cartQty === 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{qty}</span>
                      <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={handleAdd} disabled={adding} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      {adding ? 'Adding...' : 'Add to Cart'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border-2 border-brand-500 rounded-xl p-1">
                      <button onClick={() => updateItem(product.id, cartQty - 1)}
                        className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 hover:bg-brand-200 flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-brand-600">{cartQty}</span>
                      <button onClick={() => updateItem(product.id, cartQty + 1)}
                        className="w-8 h-8 rounded-lg bg-brand-500 text-white hover:bg-brand-600 flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <Link to="/cart" className="btn-secondary flex-1 text-center">View Cart</Link>
                  </div>
                )}
              </div>
            )}
            {!user && (
              <Link to="/login" className="btn-primary text-center">Login to Order</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
