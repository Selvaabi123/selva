import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Banknote, CheckCircle, Truck } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LocationPicker from '../components/LocationPicker';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const STORE_LOCATION = [10.7905, 78.7041];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    delivery_address: user?.address || '',
    notes: '',
    payment_method: 'cod',
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const getEstimatedTime = (distance) => {
    const speed = 30;
    const time = (distance / speed) * 60;
    return Math.round(time);
  };

  const distance = selectedLocation ? calculateDistance(STORE_LOCATION[0], STORE_LOCATION[1], selectedLocation[0], selectedLocation[1]) : null;
  const estimatedTime = distance ? getEstimatedTime(distance) : null;

  const handleLocationChange = (latlng) => {
    setSelectedLocation(latlng);
  };

  const handleLocationDetails = (details) => {
    setLocationDetails(details);
    if (details) {
      setForm({ ...form, delivery_address: details });
    }
  };

  const DELIVERY_RATE_PER_KM = 12;
  const BASE_FEE = 50;
  const deliveryFee = BASE_FEE;
  const grandTotal = parseFloat(total) + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.delivery_address.trim()) { toast.error('Delivery address is required'); return; }
    try {
      setPlacing(true);
      const orderData = {
        ...form,
        latitude: selectedLocation ? selectedLocation[0] : null,
        longitude: selectedLocation ? selectedLocation[1] : null,
      };
      const res = await api.post('/orders', orderData);
      setSuccess(res.data.order);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  if (success) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center page-enter">
      <div className="card p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-2">Order #{success.id}</p>
        {success.delivery_otp && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-brand-600 mb-1">Share this OTP with delivery partner:</p>
            <p className="font-bold text-3xl text-brand-700 tracking-widest">{success.delivery_otp}</p>
          </div>
        )}
        <p className="text-gray-500 mb-6 text-sm">We've received your order and will start preparing it shortly.</p>
        <p className="font-bold text-brand-600 text-xl mb-6">₹{parseFloat(success.total_price).toFixed(0)}</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/orders')} className="btn-primary flex-1">Track Order</button>
          <button onClick={() => navigate('/products')} className="btn-secondary flex-1">Order More</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-5">
            <div className="card p-6">
              <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-500" /> Delivery Address
              </h2>
              <textarea value={form.delivery_address}
                onChange={e => setForm({ ...form, delivery_address: e.target.value })}
                placeholder="Enter your full delivery address..." rows={3} className="input resize-none" required />
              <div className="mt-4">
                <LocationPicker onLocationChange={handleLocationChange} onLocationDetails={handleLocationDetails} />
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-display font-bold text-base mb-4">Special Instructions (Optional)</h2>
              <input value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="E.g. Extra spicy, no onions..." className="input" />
            </div>

            <div className="card p-6">
              <h2 className="font-display font-bold text-base mb-4">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'cod', label: 'Cash on Delivery', icon: Banknote },
                  { value: 'online', label: 'Pay Online (Mock)', icon: CreditCard },
                ].map(({ value, label, icon: Icon }) => (
                  <button type="button" key={value}
                    onClick={() => setForm({ ...form, payment_method: value })}
                    className={`p-4 rounded-xl border-2 flex items-center gap-3 transition ${form.payment_method === value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
                    <Icon className={`w-5 h-5 ${form.payment_method === value ? 'text-brand-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-semibold ${form.payment_method === value ? 'text-brand-700' : 'text-gray-600'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedLocation && (
              <div className="card p-6">
                <h2 className="font-display font-bold text-base mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-500" /> Delivery Route
                </h2>
                <div className="rounded-lg overflow-hidden" style={{ height: '300px' }}>
                  <MapContainer
                    center={selectedLocation}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={STORE_LOCATION} icon={customIcon} />
                    <Marker position={selectedLocation} icon={customIcon} />
                  </MapContainer>
                </div>
                {distance && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-brand-500" />
                      <span className="text-gray-600">Store (Trichy)</span>
                    </div>
                    <div className="flex-1 mx-3 h-0.5 bg-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white px-2 text-xs text-gray-400">{distance} km</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Your Location</span>
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                  </div>
                )}
                {estimatedTime && (
                  <div className="mt-2 text-center text-sm text-brand-600 font-medium">
                    Estimated delivery time: ~{estimatedTime} minutes
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="card p-6 sticky top-20">
              <h2 className="font-display font-bold text-base mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1">{(item.product?.name || item.name)} × {(item.quantity || item.qty)}</span>
                    <span className="font-medium ml-2">₹{((parseFloat(item.product?.price || item.price)) * (item.quantity || item.qty)).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <hr className="border-gray-100 mb-3" />
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-500"><span>Order Value</span><span>₹{parseFloat(total).toFixed(0)}</span></div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Total to Pay</span>
                  <span className="text-brand-600">₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>
              <button type="submit" disabled={placing || items.length === 0} className="btn-primary w-full">
                {placing ? 'Placing Order...' : `Place Order · ₹${grandTotal.toFixed(0)}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
