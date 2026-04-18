import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Zap, Shield, Star, ChevronRight, 
  Truck, RefreshCcw, Leaf, Award, Plus, Minus
} from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const { items, addToCart, updateItem, removeItem } = useCart();

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/products?limit=12'),
    ]).then(([catRes, prodRes]) => {
      setCategories(catRes.data.categories || []);
      setFeatured(prodRes.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  const getCategoryEmoji = (name) => {
    const n = name.toLowerCase();
    if (n.includes('fruit')) return '🍎';
    if (n.includes('vegetable') || n.includes('veggie')) return '🥦';
    if (n.includes('dairy') || n.includes('milk')) return '🥛';
    if (n.includes('snack')) return '🍿';
    if (n.includes('beverage') || n.includes('drink')) return '🧃';
    if (n.includes('bakery') || n.includes('bread')) return '🍞';
    if (n.includes('meat') || n.includes('chicken')) return '🍗';
    if (n.includes('frozen')) return '🧊';
    if (n.includes('personal')) return '🧴';
    if (n.includes('household')) return '🧹';
    return '📦';
  };

  const getCartItem = (productId) => items.find(i => i.product_id === productId || i.id === productId);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleUpdateQuantity = (product, delta) => {
    const item = getCartItem(product.id);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem(product.id);
    } else {
      updateItem(product.id, newQty);
    }
  };

  const trustBadges = [
    { icon: Truck, label: 'Free Delivery', sublabel: 'On orders ₹299+' },
    { icon: Shield, label: 'Secure Payment', sublabel: '100% Protected' },
    { icon: RefreshCcw, label: 'Easy Returns', sublabel: '7-day policy' },
    { icon: Award, label: 'Quality Assured', sublabel: 'Best products' },
  ];

  const offers = [
    { id: 1, title: '50% OFF', subtitle: 'On your first order', bg: '#FF6B00', icon: '🔥' },
    { id: 2, title: 'Free Delivery', subtitle: 'Orders above ₹299', bg: '#22C55E', icon: '🚀' },
    { id: 3, title: 'Flash Sale', subtitle: 'Limited time offer', bg: '#7C3AED', icon: '⚡' },
  ];

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: '30-min delivery', bg: '#FFF4EB', color: '#FF6B00' },
    { icon: Shield, title: '100% Genuine', desc: 'Quality products', bg: '#DCFCE7', color: '#22C55E' },
    { icon: Leaf, title: 'Always Fresh', desc: 'Farm fresh daily', bg: '#DBEAFE', color: '#3B82F6' },
    { icon: Star, title: 'Top Rated', desc: '4.8★ average', bg: '#FEF3C7', color: '#F59E0B' },
  ];

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px'
  };

  return (
    <div style={{ backgroundColor: '#F7F7F7', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{ 
        ...containerStyle,
        paddingTop: '24px',
        paddingBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            right: '80px',
            bottom: '-40px',
            width: '120px',
            height: '120px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Welcome to</p>
              <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                SwiftMart
              </h1>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px' }}>
                Fresh groceries delivered fast! 🚀
              </p>
              <Link 
                to="/products" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'white',
                  color: '#FF6B00',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                Shop Now <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>
            <div style={{
              width: '140px',
              height: '140px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'none'
            }}
            className="hide-mobile"
            >
              <svg width="64" height="64" fill="white" viewBox="0 0 24 24">
                <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges - Horizontal row */}
      <div style={{ ...containerStyle, marginBottom: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          backgroundColor: '#FFF5EE',
          borderRadius: '12px',
          padding: '16px'
        }}>
          {trustBadges.map(({ icon: Icon, label, sublabel }) => (
            <div 
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Icon style={{ width: '28px', height: '28px', color: '#FF6B00', marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features - Desktop: inline row */}
      <div style={{ ...containerStyle, marginBottom: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          {features.map(({ icon: Icon, title, desc, bg, color }) => (
            <div 
              key={title}
              style={{
                backgroundColor: bg,
                borderRadius: '12px',
                padding: '16px 12px',
                textAlign: 'center'
              }}
            >
              <Icon style={{ width: '24px', height: '24px', color, margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px', fontWeight: '700', color, marginBottom: '2px' }}>{title}</p>
              <p style={{ fontSize: '11px', color: '#6B7280' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Offers Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ ...containerStyle, marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>🔥 Today's Offers</h2>
        </div>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px' }}>
          {offers.map(offer => (
            <div 
              key={offer.id}
              style={{
                flexShrink: 0,
                width: '200px',
                minHeight: '120px',
                backgroundColor: offer.bg,
                borderRadius: '16px',
                padding: '20px',
                color: 'white'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{offer.icon}</div>
              <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{offer.title}</p>
              <p style={{ fontSize: '13px', fontWeight: '500', opacity: 0.95 }}>{offer.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories - Zepto Style */}
      {categories.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ ...containerStyle, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📦</span>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Categories</h2>
            </div>
            <Link to="/products" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FF6B00', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
              See all <ChevronRight style={{ width: '16px', height: '16px' }} />
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '8px' }}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                style={{ flexShrink: 0, width: '80px', textDecoration: 'none' }}
              >
                <div style={{
                  width: '70px',
                  height: '70px',
                  backgroundColor: '#FFF5EE',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  fontSize: '32px'
                }}>
                  {getCategoryEmoji(cat.name)}
                </div>
                <p style={{ 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#1A1A1A', 
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.3',
                  height: '2.6em'
                }}>
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular Products - Zepto Style */}
      <div style={{ maxWidth: '1200px', margin: '0px auto', padding: '0px 16px 100px' }}>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h2 className="text-base font-bold text-gray-900 m-0">Popular Products</h2>
          </div>
          <Link to="/products" className="flex items-center gap-1 text-orange-500 text-sm font-medium hover:text-orange-600">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Scroll - Zepto Style */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[150px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-28 bg-gray-200" />
                <div className="p-2.5">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
