import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Navigation, Star } from 'lucide-react';
import api from '../utils/api';
import { OrderStatusBadge, OrderTimeline } from '../components/OrderStatus';
import toast from 'react-hot-toast';

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: true }
    );
  });
};

const openNavigation = async (deliveryLat, deliveryLng, deliveryName) => {
  try {
    const userLocation = await getCurrentLocation();
    const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${deliveryLat},${deliveryLng}`;
    window.open(url, '_blank');
  } catch (err) {
    const url = `https://www.google.com/maps/search/?api=1&query=${deliveryLat},${deliveryLng}`;
    window.open(url, '_blank');
  }
};

const openAddressMap = (address) => {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  window.open(url, '_blank');
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleRate = async (rating) => {
    try {
      await api.put(`/orders/${id}/rate`, { rating });
      toast.success('Thanks for your rating!');
      const r = await api.get(`/orders/${id}`);
      setOrder(r.data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).finally(() => setLoading(false));
    const interval = setInterval(() => {
      api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-100 rounded" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="font-display text-xl font-bold text-gray-700">Order not found</h2>
      <Link to="/orders" className="btn-primary mt-4 inline-block">Back to Orders</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition font-medium">
        <ArrowLeft className="w-4 h-4" /> My Orders
      </Link>

      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-gray-400 text-sm mt-1">{new Date(order.created_at).toLocaleString('en-IN')}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px]">
              <OrderTimeline status={order.status} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-base mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items?.filter(i => i.name).map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                  <p className="text-gray-400 text-xs">× {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900 text-sm">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Order Value (Items Total)</span>
                <span>₹{parseFloat(order.subtotal || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery Fee</span>
                <span>₹{parseFloat(order.delivery_fee || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                <span>Total Paid</span>
                <span className="text-brand-600 text-lg">₹{parseFloat(order.total_price).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {order.delivery_otp && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="card p-6 bg-orange-50 border-2 border-orange-200">
            <h2 className="font-display font-bold text-base mb-2 flex items-center gap-2">
              <span className="text-lg">🔑</span> Share this OTP with Delivery Partner
            </h2>
            <p className="text-orange-700 text-sm mb-4">When delivery partner arrives, share this code to verify delivery</p>
            <div className="bg-white rounded-xl p-4 border-2 border-orange-300">
              <p className="font-bold text-5xl text-center tracking-widest text-orange-600">{order.delivery_otp}</p>
            </div>
            <div className="mt-3 bg-orange-100 rounded-lg p-3">
              <p className="text-xs text-orange-700 text-center">
                <strong>Important:</strong> Your delivery partner will ask for this code to complete delivery
              </p>
            </div>
          </div>
        )}

        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-base">Delivery Info</h2>
          {order.delivery_address && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600 text-sm">{order.delivery_address}</p>
              </div>
              {order.status !== 'delivered' && (
                <button
                  onClick={() => openAddressMap(order.delivery_address)}
                  className="w-full py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Navigate to Address
                </button>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <CreditCard className="w-4 h-4 text-brand-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Payment</p>
              <p className={`text-sm ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Cash on Delivery'}
              </p>
            </div>
          </div>
          {order.delivery_partner_name && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <span className="text-lg">🛵</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Delivery Partner</p>
                  <p className="text-sm text-gray-500">{order.delivery_partner_name}</p>
                  {order.delivery_partner_phone && (
                    <p className="text-sm text-gray-400">{order.delivery_partner_phone}</p>
                  )}
                </div>
              </div>
              {order.status !== 'delivered' && (
                <>
                  {order.delivery_latitude && order.delivery_longitude ? (
                    <button
                      onClick={() => openNavigation(order.delivery_latitude, order.delivery_longitude, order.delivery_partner_name)}
                      className="w-full py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Track Delivery Partner (Live Location)
                    </button>
                  ) : (
                    <button
                      onClick={() => openAddressMap(order.delivery_address)}
                      className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate to Delivery Address
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          {order.notes && (
            <div className="flex gap-3">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-sm font-medium text-gray-700">Special Instructions</p>
                <p className="text-sm text-gray-500">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {order.status === 'delivered' && (
          <div className="card p-6">
            <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" /> Rate Your Delivery
            </h2>
            {order.customer_rating ? (
              <div className="flex items-center gap-2">
                <p className="text-gray-600">Your rating:</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${star <= order.customer_rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">How was your delivery experience?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      className="p-2 rounded-full hover:bg-yellow-50 transition"
                    >
                      <Star
                        className="w-8 h-8 text-yellow-400 hover:fill-yellow-400 transition"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-400">
                  Tap a star to rate (1=Poor, 5=Excellent)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
