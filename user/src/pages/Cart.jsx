import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MapPin, Tag, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

export default function Cart() {
  const { items, total, updateItem, removeItem, fetchCart } = useCart();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (productId, name) => {
    setDeletingId(productId);
    setTimeout(() => {
      removeItem(productId);
      toast.success(`${name} removed from cart`);
      setDeletingId(null);
    }, 300);
  };

  const deliveryFee = items.length > 0 ? 50 : 0;
  const grandTotal = parseFloat(total) + deliveryFee;

  if (items.length === 0) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <div style={{ width: '120px', height: '120px', backgroundColor: '#FFF4EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShoppingBag style={{ width: '56px', height: '56px', color: '#FF9A3C' }} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>Your cart is empty 🛒</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>Looks like you haven't added anything to your cart yet</p>
        <Link to="/products" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
          color: 'white', fontWeight: '700', padding: '14px 28px', borderRadius: '14px', fontSize: '15px', textDecoration: 'none'
        }}>
          Browse Menu <ArrowRight style={{ width: '16px', height: '16px' }} />
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F7F7F7', minHeight: '100vh' }}>
      {/* Desktop Layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="hide-mobile">
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1A1A1A', marginBottom: '24px' }}>🛒 Your Cart</h1>
        
        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Cart Items - Left Column */}
          <div style={{ flex: 1 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A' }}>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </h2>
                <Link to="/products" style={{ color: '#FF6B00', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                  + Add More
                </Link>
              </div>
              
              {items.map(item => (
                <div key={item.product_id} style={{
                  display: 'flex', gap: '16px', padding: '16px 0',
                  borderBottom: '1px solid #F3F4F6'
                }}>
                  <img src={item.product?.image_url || 'https://picsum.photos/200'} alt={item.product?.name}
                    style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://picsum.photos/200'; }} 
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                      {item.product?.name || item.name}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#FF6B00', fontWeight: '700', marginBottom: '12px' }}>
                      ₹{parseFloat(item.product?.price || item.price).toFixed(0)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F7F7F7', borderRadius: '10px', padding: '4px' }}>
                        <button onClick={() => (item.quantity || item.qty) <= 1 ? handleRemove(item.product_id, item.product?.name) : updateItem(item.product_id, (item.quantity || item.qty) - 1)}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'white', border: 'none', cursor: 'pointer' }}>
                          <Minus style={{ width: '14px', height: '14px', color: '#6B7280' }} />
                        </button>
                        <span style={{ width: '28px', textAlign: 'center', fontWeight: '700' }}>{item.quantity || item.qty}</span>
                        <button onClick={() => updateItem(item.product_id, (item.quantity || item.qty) + 1)}
                          disabled={(item.quantity || item.qty) >= 10}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FF6B00', border: 'none', cursor: 'pointer', opacity: (item.quantity || item.qty) >= 10 ? 0.5 : 1 }}>
                          <Plus style={{ width: '14px', height: '14px', color: 'white' }} />
                        </button>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>
                        ₹{((parseFloat(item.product?.price || item.price)) * (item.quantity || item.qty)).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(item.product_id, item.product?.name)}
                    style={{ backgroundColor: '#FEE2E2', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer', height: 'fit-content' }}>
                    <Trash2 style={{ width: '18px', height: '18px', color: '#EF4444' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div style={{ width: '380px', flexShrink: 0 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px' }}>Order Summary</h2>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>Item Total</span>
                  <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: '500' }}>₹{parseFloat(total).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>Delivery Fee</span>
                  <span style={{ fontSize: '14px', color: grandTotal >= 299 ? '#22C55E' : '#1A1A1A', fontWeight: '500' }}>
                    {grandTotal >= 299 ? 'FREE' : '₹50'}
                  </span>
                </div>
                {grandTotal >= 299 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', color: '#22C55E' }}>Free Delivery</span>
                    <span style={{ fontSize: '14px', color: '#22C55E', fontWeight: '500' }}>-₹50</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #E5E7EB', marginTop: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A' }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#FF6B00' }}>₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>

              {grandTotal < 299 && (
                <div style={{ padding: '12px', backgroundColor: '#FFF4EB', borderRadius: '10px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>Add ₹{(299 - grandTotal).toFixed(0)} more for FREE delivery!</p>
                </div>
              )}

              <button onClick={() => navigate('/checkout')} style={{
                width: '100%', height: '52px', background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                color: 'white', fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                Proceed to Checkout <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
              
              <Link to="/products" style={{ display: 'block', textAlign: 'center', marginTop: '14px', color: '#6B7280', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div style={{ paddingBottom: '200px' }} className="hide-desktop">
        {/* Header */}
        <div style={{ backgroundColor: 'white', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#FFF4EB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag style={{ width: '20px', height: '20px', color: '#FF6B00' }} />
              </div>
              <h1 style={{ fontSize: '16px', fontWeight: '800', color: '#1A1A1A' }}>Your Cart ({items.length})</h1>
            </div>
            <Link to="/products" style={{ padding: '6px 12px', backgroundColor: '#FFF4EB', color: '#FF6B00', borderRadius: '8px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
              + Add
            </Link>
          </div>
        </div>

        {/* Promo Banner */}
        {grandTotal < 299 && (
          <div style={{ margin: '12px', padding: '12px', background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag style={{ width: '18px', height: '18px' }} />
            <p style={{ fontSize: '12px', fontWeight: '600', flex: 1 }}>Add ₹{(299 - grandTotal).toFixed(0)} more for FREE delivery!</p>
          </div>
        )}

        {/* Cart Items */}
        <div style={{ padding: '0 12px' }}>
          {items.map(item => (
            <div key={item.product_id} style={{
              backgroundColor: 'white', borderRadius: '14px', padding: '14px', marginBottom: '10px',
              display: 'flex', gap: '12px', opacity: deletingId === item.product_id ? 0.5 : 1,
              transform: deletingId === item.product_id ? 'translateX(50px)' : 'translateX(0)',
              transition: 'all 0.3s'
            }}>
              <img src={item.product?.image_url || 'https://picsum.photos/200'} alt={item.product?.name}
                style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }}
                onError={(e) => { e.target.src = 'https://picsum.photos/200'; }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product?.name || item.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#FF6B00', fontWeight: '700', marginBottom: '10px' }}>₹{parseFloat(item.product?.price || item.price).toFixed(0)}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F7F7F7', borderRadius: '8px', padding: '3px' }}>
                    <button onClick={() => (item.quantity || item.qty) <= 1 ? handleRemove(item.product_id, item.product?.name) : updateItem(item.product_id, (item.quantity || item.qty) - 1)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'white', border: 'none', cursor: 'pointer' }}>
                      <Minus style={{ width: '12px', height: '12px', color: '#6B7280' }} />
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>{item.quantity || item.qty}</span>
                    <button onClick={() => updateItem(item.product_id, (item.quantity || item.qty) + 1)}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FF6B00', border: 'none', cursor: 'pointer' }}>
                      <Plus style={{ width: '12px', height: '12px', color: 'white' }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>₹{((parseFloat(item.product?.price || item.price)) * (item.quantity || item.qty)).toFixed(0)}</span>
                    <button onClick={() => handleRemove(item.product_id, item.product?.name)}
                      style={{ backgroundColor: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                      <Trash2 style={{ width: '14px', height: '14px', color: '#EF4444' }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Info */}
        <div style={{ margin: '12px', padding: '12px', backgroundColor: '#DCFCE7', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck style={{ width: '18px', height: '18px', color: '#22C55E' }} />
          <p style={{ fontSize: '12px', color: '#166534' }}>{grandTotal >= 299 ? '🎉 FREE delivery!' : 'Standard delivery'}</p>
        </div>

        {/* Sticky Bottom Summary */}
        <div style={{
          position: 'fixed', bottom: '80px', left: 0, right: 0, backgroundColor: 'white',
          padding: '14px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', borderRadius: '20px 20px 0 0'
        }}>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#FF6B00' }}>₹{grandTotal.toFixed(0)}</span>
            </div>
            <button onClick={() => navigate('/checkout')} style={{
              width: '100%', height: '50px', background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
              color: 'white', fontWeight: '700', fontSize: '15px', border: 'none', borderRadius: '14px', cursor: 'pointer'
            }}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
