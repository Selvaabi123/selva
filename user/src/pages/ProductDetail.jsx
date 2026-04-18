import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingCart, Plus, Minus, Package, ShoppingBag, 
  ArrowRight, Check, Heart, Share2, Star, Truck, Shield, Clock
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, updateItem, items } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [wishlist, setWishlist] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products?category=${id}`)
    ]).then(([prodRes, relRes]) => {
      setProduct(prodRes.data.product);
      setRelated((relRes.data.products || []).filter(p => p.id !== parseInt(id)).slice(0, 6));
    }).finally(() => setLoading(false));
  }, [id]);

  const cartItem = items.find(i => i.product_id === parseInt(id));
  const cartQty = cartItem?.quantity || 0;

  const handleAdd = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (user.role !== 'user') { toast.error('Only customers can order'); return; }
    try {
      setAdding(true);
      await addToCart(product.id, qty);
      toast.success(`${product.name} added to cart!`);
    } catch { toast.error('Failed to add to cart'); } 
    finally { setAdding(false); }
  };

  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F7F7F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #FF6B00',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    </div>
  );

  if (!product) return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F7F7F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <ShoppingBag style={{ width: '80px', height: '80px', color: '#9CA3AF', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
          Product not found
        </h2>
        <Link 
          to="/products" 
          style={{
            backgroundColor: '#FF6B00',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '600',
            textDecoration: 'none'
          }}
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F7F7F7', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Floating Back Button */}
      <Link 
        to="/products" 
        style={{
          position: 'fixed',
          top: '80px',
          left: '16px',
          zIndex: 100,
          width: '44px',
          height: '44px',
          backgroundColor: 'white',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <ArrowLeft style={{ width: '20px', height: '20px', color: '#1A1A1A' }} />
      </Link>

      {/* Action Buttons */}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '16px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={() => setWishlist(!wishlist)}
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Heart 
            style={{ 
              width: '20px', 
              height: '20px', 
              color: wishlist ? '#EF4444' : '#6B7280',
              fill: wishlist ? '#EF4444' : 'none'
            }} 
          />
        </button>
        <button
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Share2 style={{ width: '20px', height: '20px', color: '#6B7280' }} />
        </button>
      </div>

      {/* Product Image */}
      <div style={{ position: 'relative' }}>
        <img 
          src={product.image_url || 'https://picsum.photos/600'} 
          alt={product.name} 
          style={{ 
            width: '100%', 
            height: '350px', 
            objectFit: 'cover' 
          }}
          onError={(e) => { e.target.src = 'https://picsum.photos/600'; }} 
        />
        {product.category_name && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            backgroundColor: '#FF6B00',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {product.category_name}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '24px 24px 0 0',
        marginTop: '-24px',
        position: 'relative',
        zIndex: 10,
        padding: '24px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>
            {product.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[1,2,3,4,5].map(i => (
                <Star 
                  key={i}
                  style={{ 
                    width: '14px', 
                    height: '14px', 
                    color: i <= 4 ? '#F59E0B' : '#E5E7EB',
                    fill: i <= 4 ? '#F59E0B' : 'none'
                  }} 
                />
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>(4.0)</span>
          </div>
        </div>

        <p style={{ 
          fontSize: '14px', 
          color: '#6B7280', 
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          {product.description}
        </p>

        {/* Price & Stock */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '32px', fontWeight: '800', color: '#FF6B00' }}>
            ₹{parseFloat(product.price).toFixed(0)}
          </span>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            backgroundColor: product.stock > 0 ? '#DCFCE7' : '#FEE2E2',
            padding: '6px 12px',
            borderRadius: '20px'
          }}>
            <Package style={{ width: '16px', height: '16px', color: product.stock > 0 ? '#22C55E' : '#EF4444' }} />
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: product.stock > 0 ? '#22C55E' : '#EF4444'
            }}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
        </div>

        {/* Trust Badges */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#F7F7F7',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Truck style={{ width: '20px', height: '20px', color: '#FF6B00', margin: '0 auto 6px' }} />
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#1A1A1A' }}>Free Delivery</p>
          </div>
          <div style={{
            backgroundColor: '#F7F7F7',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Shield style={{ width: '20px', height: '20px', color: '#22C55E', margin: '0 auto 6px' }} />
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#1A1A1A' }}>Quality Assured</p>
          </div>
          <div style={{
            backgroundColor: '#F7F7F7',
            padding: '12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Clock style={{ width: '20px', height: '20px', color: '#3B82F6', margin: '0 auto 6px' }} />
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#1A1A1A' }}>30 Min</p>
          </div>
        </div>

        {/* Quantity Selector */}
        {product.stock > 0 && user?.role === 'user' && (
          <div>
            {cartQty === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Qty Selector */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  backgroundColor: '#F7F7F7',
                  borderRadius: '12px',
                  padding: '4px'
                }}>
                  <button 
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                    }}
                  >
                    <Minus style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                  </button>
                  <span style={{ 
                    width: '40px', 
                    textAlign: 'center', 
                    fontWeight: '700', 
                    fontSize: '18px',
                    color: '#1A1A1A'
                  }}>
                    {qty}
                  </span>
                  <button 
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#FF6B00',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px', color: 'white' }} />
                  </button>
                </div>
                
                {/* Add to Cart Button */}
                <button 
                  onClick={handleAdd} 
                  disabled={adding} 
                  style={{
                    flex: 1,
                    height: '52px',
                    background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: adding ? 'not-allowed' : 'pointer',
                    opacity: adding ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
                  }}
                >
                  <ShoppingCart style={{ width: '20px', height: '20px' }} />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            ) : (
              /* In Cart State */
              <div style={{
                backgroundColor: '#FFF4EB',
                border: '2px solid #FF9A3C',
                borderRadius: '16px',
                padding: '16px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check style={{ width: '18px', height: '18px', color: '#FF6B00' }} />
                    <span style={{ fontWeight: '600', color: '#FF6B00' }}>In your cart</span>
                  </div>
                  <span style={{ fontWeight: '700', color: '#FF6B00' }}>{cartQty} items</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '4px'
                  }}>
                    <button 
                      onClick={() => updateItem(product.id, cartQty - 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#F7F7F7',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus style={{ width: '14px', height: '14px', color: '#6B7280' }} />
                    </button>
                    <span style={{ 
                      width: '32px', 
                      textAlign: 'center', 
                      fontWeight: '700',
                      color: '#FF6B00'
                    }}>
                      {cartQty}
                    </span>
                    <button 
                      onClick={() => updateItem(product.id, cartQty + 1)}
                      disabled={cartQty >= product.stock}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#FF6B00',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: cartQty >= product.stock ? 'not-allowed' : 'pointer',
                        opacity: cartQty >= product.stock ? 0.5 : 1
                      }}
                    >
                      <Plus style={{ width: '14px', height: '14px', color: 'white' }} />
                    </button>
                  </div>
                  <Link 
                    to="/cart" 
                    style={{
                      flex: 1,
                      height: '44px',
                      backgroundColor: '#FF6B00',
                      color: 'white',
                      fontWeight: '600',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      gap: '6px'
                    }}
                  >
                    View Cart <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Login Prompt */}
        {!user && (
          <Link 
            to="/login" 
            style={{
              display: 'flex',
              width: '100%',
              height: '52px',
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              border: 'none',
              borderRadius: '16px',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
            }}
          >
            Login to Order
          </Link>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div style={{ padding: '24px 16px 0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
            You may also like
          </h2>
          <div style={{ 
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '16px'
          }}>
            {related.map(p => (
              <div key={p.id} style={{ flexShrink: 0, width: '150px' }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
