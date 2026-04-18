import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, CreditCard, Navigation, Star, Clock, 
  Package, CheckCircle, Phone, ChefHat, Bike, Home, FileText
} from 'lucide-react';
import api from '../utils/api';
import { OrderStatusBadge } from '../components/OrderStatus';
import SanitizedText from '../components/SanitizedText';
import toast from 'react-hot-toast';

const openNavigation = (deliveryLat, deliveryLng) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLat},${deliveryLng}&travelmode=driving`;
  window.open(url, '_blank');
};

const openAddressMap = (address) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, '_blank');
};

const STEPS = [
  { key: 'pending', label: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'picked', label: 'Picked Up', icon: Bike },
  { key: 'out_for_delivery', label: 'On the Way', icon: Bike },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleRate = async (rating) => {
    try {
      await api.put(`/orders/${id}/rate`, { rating });
      toast.success('Thanks for your rating! ⭐');
      const r = await api.get(`/orders/${id}`);
      setOrder(r.data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).finally(() => setLoading(false));
  }, [id]);

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

  if (!order) return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F7F7F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
          Order not found
        </h2>
        <Link 
          to="/orders" 
          style={{
            backgroundColor: '#FF6B00',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '600',
            textDecoration: 'none'
          }}
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div style={{ backgroundColor: '#F7F7F7', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Link 
          to="/orders" 
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#F7F7F7',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft style={{ width: '20px', height: '20px', color: '#1A1A1A' }} />
        </Link>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A' }}>
            Order #{order.id}
          </h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>
            {new Date(order.created_at).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="two-col-grid">
          {/* Left Column - Order Details */}
          <div>
            {/* Order Status Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <OrderStatusBadge status={order.status} />
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#FF6B00' }}>
                  ₹{parseFloat(order.total_price).toFixed(0)}
                </span>
              </div>

              {/* Progress Stepper */}
              {isCancelled ? (
                <div style={{
                  backgroundColor: '#FEE2E2',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '16px', fontWeight: '700', color: '#EF4444' }}>
                    ⚠️ Order Cancelled
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    position: 'relative'
                  }}>
                    {STEPS.map((step, i) => {
                      const Icon = step.icon;
                      const isCompleted = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      
                      return (
                        <div 
                          key={step.key} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            flex: 1,
                            position: 'relative'
                          }}
                        >
                          {/* Line */}
                          {i < STEPS.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '14px',
                              left: '50%',
                              width: '100%',
                              height: '2px',
                              backgroundColor: isCompleted ? '#FF6B00' : '#E5E7EB',
                              zIndex: 0
                            }} />
                          )}
                          
                          {/* Circle */}
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted ? '#FF6B00' : '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            border: isCurrent ? '3px solid #FF9A3C' : 'none'
                          }}>
                            <Icon style={{ width: '14px', height: '14px', color: isCompleted ? 'white' : '#9CA3AF' }} />
                          </div>
                          
                          {/* Label */}
                          <span style={{ 
                            fontSize: '9px', 
                            color: isCompleted ? '#FF6B00' : '#9CA3AF',
                            fontWeight: isCurrent ? '700' : '500',
                            marginTop: '4px',
                            textAlign: 'center'
                          }}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Current Status Text */}
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#FFF4EB',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#FF6B00' }}>
                      {currentStepIndex === STEPS.length - 1 
                        ? '🎉 Your order has been delivered!' 
                        : `Your order is ${STEPS[currentStepIndex]?.label.toLowerCase()}`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Items Ordered */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#1A1A1A', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Package style={{ width: '18px', height: '18px', color: '#FF6B00' }} />
                Items Ordered ({order.items?.length || 0})
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items?.filter(i => i.name).map((item, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      paddingBottom: i < order.items.filter(x => x.name).length - 1 ? '12px' : 0,
                      borderBottom: i < order.items.filter(x => x.name).length - 1 ? '1px solid #F3F4F6' : 'none'
                    }}
                  >
                    <img 
                      src={item.image_url || 'https://picsum.photos/60'}
                      alt={item.name}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => { e.target.src = 'https://picsum.photos/60'; }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{item.name}</p>
                      <p style={{ fontSize: '12px', color: '#6B7280' }}>× {item.quantity}</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid #E5E7EB' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6B7280', fontSize: '13px' }}>Item Total</span>
                  <span style={{ color: '#1A1A1A', fontSize: '13px' }}>₹{parseFloat(order.subtotal || 0).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6B7280', fontSize: '13px' }}>Delivery Fee</span>
                  <span style={{ color: '#22C55E', fontSize: '13px' }}>
                    {parseFloat(order.delivery_fee || 0) === 0 ? 'FREE' : `₹${parseFloat(order.delivery_fee || 0).toFixed(0)}`}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '2px solid #E5E7EB'
                }}>
                  <span style={{ color: '#1A1A1A', fontSize: '16px', fontWeight: '700' }}>Total</span>
                  <span style={{ color: '#FF6B00', fontSize: '18px', fontWeight: '800' }}>
                    ₹{parseFloat(order.total_price).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#1A1A1A', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MapPin style={{ width: '18px', height: '18px', color: '#FF6B00' }} />
                Delivery Info
              </h2>

              {order.delivery_address && (
                <div style={{ 
                  backgroundColor: '#F7F7F7', 
                  borderRadius: '12px', 
                  padding: '14px',
                  marginBottom: '12px'
                }}>
                  <SanitizedText 
                    text={order.delivery_address} 
                    style={{ fontSize: '14px', color: '#1A1A1A', marginBottom: '12px', display: 'block' }} 
                  />
                  {order.status !== 'delivered' && (
                    <button
                      onClick={() => openAddressMap(order.delivery_address)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#FF6B00',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Navigation style={{ width: '16px', height: '16px' }} />
                      Navigate to Address
                    </button>
                  )}
                </div>
              )}

              {/* Payment Info */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '14px',
                backgroundColor: '#F7F7F7',
                borderRadius: '12px',
                marginBottom: '12px'
              }}>
                <CreditCard style={{ width: '20px', height: '20px', color: '#FF6B00' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>Payment</p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: order.payment_status === 'paid' ? '#22C55E' : '#F59E0B',
                    fontWeight: order.payment_status === 'paid' ? '600' : '500'
                  }}>
                    {order.payment_status === 'paid' ? '✅ Paid Online' : '💵 Cash on Delivery'}
                  </p>
                </div>
              </div>

              {/* Delivery Partner */}
              {order.delivery_partner_name && (
                <div style={{ 
                  backgroundColor: '#F7F7F7', 
                  borderRadius: '12px', 
                  padding: '14px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#FFF4EB',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FF6B00',
                      fontWeight: '800',
                      fontSize: '18px'
                    }}>
                      {order.delivery_partner_name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>
                        {order.delivery_partner_name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280' }}>Delivery Partner</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {order.delivery_partner_phone && (
                      <a 
                        href={`tel:${order.delivery_partner_phone}`}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#FF6B00',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '13px',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        <Phone style={{ width: '14px', height: '14px' }} />
                        Call
                      </a>
                    )}
                    {order.delivery_latitude && order.delivery_longitude && order.status !== 'delivered' && (
                      <button
                        onClick={() => openNavigation(order.delivery_latitude, order.delivery_longitude)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '13px',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Navigation style={{ width: '14px', height: '14px' }} />
                        Track
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {order.notes && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '10px', 
                  padding: '14px',
                  backgroundColor: '#DBEAFE',
                  borderRadius: '12px',
                  marginTop: '12px'
                }}>
                  <FileText style={{ width: '18px', height: '18px', color: '#3B82F6', marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#1E40AF', marginBottom: '2px' }}>
                      Special Instructions
                    </p>
                    <SanitizedText 
                      text={order.notes} 
                      style={{ fontSize: '13px', color: '#1E40AF', display: 'block' }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - OTP & Rating */}
          <div>
            {/* OTP Card */}
            {order.delivery_otp && !isCancelled && (
              <div style={{ 
                background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                borderRadius: '16px', 
                padding: '20px', 
                marginBottom: '16px',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Clock style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Delivery OTP</span>
                </div>
                <p style={{ fontSize: '12px', opacity: 0.9, marginBottom: '12px' }}>
                  Share this code with delivery partner
                </p>
                <div style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontSize: '36px', 
                    fontWeight: '800', 
                    color: '#FF6B00', 
                    letterSpacing: '12px',
                    marginLeft: '12px'
                  }}>
                    {order.delivery_otp}
                  </p>
                </div>
              </div>
            )}

            {/* Rating Section */}
            {order.status === 'delivered' && (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <h2 style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: '#1A1A1A', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Star style={{ width: '18px', height: '18px', color: '#F59E0B', fill: '#F59E0B' }} />
                  Rate Your Delivery
                </h2>
                
                {order.customer_rating ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          style={{ 
                            width: '28px', 
                            height: '28px',
                            color: star <= order.customer_rating ? '#F59E0B' : '#E5E7EB',
                            fill: star <= order.customer_rating ? '#F59E0B' : 'none'
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ color: '#22C55E', fontSize: '14px', fontWeight: '600' }}>
                      Thanks for rating! 🎉
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(star)}
                          style={{
                            padding: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            transition: 'transform 0.2s'
                          }}
                        >
                          <Star 
                            style={{ 
                              width: '36px', 
                              height: '36px',
                              color: '#F59E0B',
                              fill: '#F59E0B'
                            }} 
                          />
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Tap a star to rate your experience</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
