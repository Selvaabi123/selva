import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LocationPicker from '../components/LocationPicker';
import SanitizedText from '../components/SanitizedText';
import { ArrowLeft, MapPin, CreditCard, Check, Clock, ShoppingBag, Shield, Lock, FileText } from 'lucide-react';

const COLORS = { primary: '#FF6B00', accent: '#FF9A3C', success: '#22C55E', background: '#F7F7F7', card: '#FFFFFF', textPrimary: '#1A1A1A', textSecondary: '#6B7280', lightOrange: '#FFF4EB' };
const paymentMethods = [
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when you receive', icon: '💵' },
  { id: 'upi', label: 'UPI Payment', description: 'GPay, PhonePe, Paytm', icon: '📱' },
  { id: 'card', label: 'Debit/Credit Card', description: 'Visa, Mastercard, RuPay', icon: '💳' },
];

function loadScript(src) { return new Promise((resolve) => { const script = document.createElement('script'); script.src = src; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script); }); }
async function initRazorpay() { return await loadScript('https://checkout.razorpay.com/v1/checkout.js'); }

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [form, setForm] = useState({ delivery_address: user?.address || '', notes: '', payment_method: 'cod' });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);

  useEffect(() => { initRazorpay().then(setRazorpayLoaded); }, []);
  useEffect(() => { if (locationDetails) setForm({ ...form, delivery_address: locationDetails }); }, [locationDetails]);

  const deliveryFee = total >= 299 ? 0 : 50;
  const grandTotal = parseFloat(total) + deliveryFee;

  const handleRazorpayPayment = async () => {
    try {
      setProcessing(true);
      const orderRes = await api.post('/payment/create-order', { amount: grandTotal, currency: 'INR' });
      const { order, key_id } = orderRes.data;
      const options = {
        key: key_id, amount: order.amount, currency: order.currency, name: 'SwiftMart', description: `Order Payment - ₹${grandTotal}`, order_id: order.id,
        prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payment/verify', { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
            if (verifyRes.data.success) handlePlaceOrder('online');
          } catch { toast.error('Payment verification failed'); setProcessing(false); }
        },
        modal: { ondismiss: () => { setProcessing(false); toast.error('Payment cancelled'); } },
        theme: { color: COLORS.primary },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => { toast.error(`Payment failed: ${response.error.description}`); setProcessing(false); });
      rzp.open();
    } catch { toast.error('Failed to initialize payment'); setProcessing(false); }
  };

  const handlePlaceOrder = async (paymentMethodOverride) => {
    try {
      setPlacing(true);
      const orderData = { ...form, payment_method: paymentMethodOverride || form.payment_method, latitude: selectedLocation ? selectedLocation[0] : null, longitude: selectedLocation ? selectedLocation[1] : null };
      const res = await api.post('/orders', orderData);
      setSuccess(res.data.order);
      clearCart();
      toast.success('Order placed successfully! 🎉');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to place order'); }
    finally { setPlacing(false); setProcessing(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.delivery_address.trim()) { toast.error('Please add a delivery address'); return; }
    if (form.payment_method === 'cod') { handlePlaceOrder('cod'); }
    else { if (!razorpayLoaded) { toast.error('Payment system loading... Please try again'); return; } handleRazorpayPayment(); }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: COLORS.card, borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', padding: '40px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Check style={{ width: '40px', height: '40px', color: COLORS.success }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: COLORS.textPrimary, marginBottom: '8px' }}>Order Placed! 🎉</h2>
        <p style={{ color: COLORS.textSecondary, marginBottom: '24px' }}>Order #{success.id}</p>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.success}, #16A34A)`, color: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>Total Amount</p>
          <p style={{ fontSize: '32px', fontWeight: '800' }}>₹{parseFloat(success.total_price).toFixed(0)}</p>
        </div>
        {success.delivery_otp && (
          <div style={{ backgroundColor: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ color: '#92400E', fontSize: '14px', fontWeight: '600' }}>Delivery OTP:</p>
            <p style={{ color: '#B45309', fontSize: '36px', fontWeight: '800', letterSpacing: '8px' }}>{success.delivery_otp}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/orders')} style={{ flex: 1, padding: '14px', backgroundColor: COLORS.success, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Track Order</button>
          <button onClick={() => navigate('/products')} style={{ flex: 1, padding: '14px', backgroundColor: '#F3F4F6', color: COLORS.textPrimary, border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Order More</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background }}>
      {/* Desktop Layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="hide-mobile">
        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Left Column - Form */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1A1A1A', marginBottom: '24px' }}>Checkout</h1>
            
            {/* Delivery Address */}
            <div style={{ backgroundColor: COLORS.card, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: COLORS.lightOrange, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin style={{ width: '20px', height: '20px', color: COLORS.primary }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.textPrimary }}>Delivery Address</h2>
                  <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>Where should we deliver?</p>
                </div>
              </div>
              <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', height: '200px', border: '2px solid #E5E7EB' }}>
                <LocationPicker onLocationChange={setSelectedLocation} onLocationDetails={setLocationDetails} />
              </div>
              {locationDetails && (
                <div style={{ backgroundColor: COLORS.lightOrange, borderRadius: '12px', padding: '14px', border: `2px solid ${COLORS.accent}`, marginBottom: '14px' }}>
                  <SanitizedText text={locationDetails} style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: '500', display: 'block' }} />
                </div>
              )}
              <textarea value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} placeholder="Or enter address manually..." rows={3}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
            </div>

            {/* Payment Method */}
            <div style={{ backgroundColor: COLORS.card, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: COLORS.lightOrange, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard style={{ width: '20px', height: '20px', color: COLORS.primary }} />
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.textPrimary }}>Payment Method</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {paymentMethods.map(({ id, label, description, icon }) => (
                  <button type="button" key={id} onClick={() => setForm({ ...form, payment_method: id })}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '12px', border: `2px solid ${form.payment_method === id ? COLORS.primary : '#E5E7EB'}`,
                      backgroundColor: form.payment_method === id ? COLORS.lightOrange : COLORS.card, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: '24px' }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: COLORS.textPrimary }}>{label}</p>
                      <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>{description}</p>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${form.payment_method === id ? COLORS.primary : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {form.payment_method === id && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS.primary }} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div style={{ backgroundColor: COLORS.card, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileText style={{ width: '20px', height: '20px', color: COLORS.primary }} />
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.textPrimary }}>Special Instructions</h2>
              </div>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="E.g., Ring doorbell, leave at gate..." rows={2}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #E5E7EB', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>

          {/* Right Column - Summary */}
          <div style={{ width: '400px', flexShrink: 0 }}>
            <div style={{ backgroundColor: COLORS.card, borderRadius: '16px', padding: '24px', position: 'sticky', top: '100px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: COLORS.textPrimary, marginBottom: '20px' }}>Order Summary</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {items.map(item => (
                  <div key={item.product_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={item.product?.image_url || 'https://picsum.photos/100'} alt={item.product?.name}
                      style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: COLORS.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product?.name}</p>
                      <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>× {item.quantity || item.qty}</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: COLORS.textPrimary }}>₹{((parseFloat(item.product?.price || item.price)) * (item.quantity || item.qty)).toFixed(0)}</p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Item Total</span>
                  <span style={{ color: COLORS.textPrimary, fontSize: '14px' }}>₹{parseFloat(total).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Delivery Fee</span>
                  <span style={{ color: deliveryFee === 0 ? COLORS.success : COLORS.textPrimary, fontSize: '14px', fontWeight: '500' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #E5E7EB', paddingTop: '14px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: COLORS.textPrimary }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: COLORS.primary }}>₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>

              <button type="submit" onClick={handleSubmit} disabled={placing || processing || items.length === 0}
                style={{ width: '100%', height: '52px', backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', opacity: (placing || processing || items.length === 0) ? 0.6 : 1, marginTop: '20px' }}>
                {placing || processing ? 'Processing...' : `Place Order • ₹${grandTotal.toFixed(0)}`}
              </button>
              <p style={{ textAlign: 'center', fontSize: '11px', color: COLORS.textSecondary, marginTop: '12px' }}>Secure payment powered by Razorpay 🔒</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div style={{ paddingBottom: '140px' }} className="hide-desktop">
        <div style={{ backgroundColor: 'white', padding: '16px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft style={{ width: '18px', height: '18px', color: COLORS.textPrimary }} />
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: COLORS.textPrimary }}>Checkout</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          <div style={{ backgroundColor: COLORS.card, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <MapPin style={{ width: '18px', height: '18px', color: COLORS.primary }} />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.textPrimary }}>Delivery Address</h2>
            </div>
            <div style={{ marginBottom: '14px', borderRadius: '10px', overflow: 'hidden', height: '160px', border: '2px solid #E5E7EB' }}>
              <LocationPicker onLocationChange={setSelectedLocation} onLocationDetails={setLocationDetails} />
            </div>
            <textarea value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} placeholder="Or enter manually..." rows={2}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #E5E7EB', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
          </div>

          <div style={{ backgroundColor: COLORS.card, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <CreditCard style={{ width: '18px', height: '18px', color: COLORS.primary }} />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: COLORS.textPrimary }}>Payment</h2>
            </div>
            {paymentMethods.map(({ id, label, description, icon }) => (
              <button type="button" key={id} onClick={() => setForm({ ...form, payment_method: id })}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '10px', border: `2px solid ${form.payment_method === id ? COLORS.primary : '#E5E7EB'}`,
                  backgroundColor: form.payment_method === id ? COLORS.lightOrange : COLORS.card, cursor: 'pointer', marginBottom: '8px', textAlign: 'left' }}>
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: COLORS.textPrimary }}>{label}</p>
                  <p style={{ fontSize: '11px', color: COLORS.textSecondary }}>{description}</p>
                </div>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${form.payment_method === id ? COLORS.primary : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {form.payment_method === id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.primary }} />}
                </div>
              </button>
            ))}
          </div>

          <div style={{ backgroundColor: COLORS.card, borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: COLORS.textSecondary, fontSize: '13px' }}>Item Total</span>
              <span style={{ color: COLORS.textPrimary, fontSize: '13px' }}>₹{parseFloat(total).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: COLORS.textSecondary, fontSize: '13px' }}>Delivery Fee</span>
              <span style={{ color: deliveryFee === 0 ? COLORS.success : COLORS.textPrimary, fontSize: '13px' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #E5E7EB', paddingTop: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: COLORS.textPrimary }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: COLORS.primary }}>₹{grandTotal.toFixed(0)}</span>
            </div>
          </div>
        </form>

        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, padding: '14px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', borderRadius: '20px 20px 0 0' }}>
          <button type="submit" onClick={handleSubmit} disabled={placing || processing || items.length === 0}
            style={{ width: '100%', height: '50px', backgroundColor: COLORS.primary, color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: (placing || processing || items.length === 0) ? 0.6 : 1 }}>
            {placing || processing ? 'Processing...' : `Place Order • ₹${grandTotal.toFixed(0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
