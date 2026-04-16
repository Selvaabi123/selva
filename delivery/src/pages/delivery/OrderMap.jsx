import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Navigation, MapPin, Phone, Clock, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const storeIcon = L.divIcon({
  className: 'store-marker',
  html: `<div style="background-color: #22c55e; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20 4H4v2h16M4 18h16v-2H4v2M4 12h16v-2H4v2"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const STORE_LOCATION = [10.7905, 78.7041];

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

function getEstimatedTime(distance) {
  const speed = 30;
  const time = (distance / speed) * 60;
  return Math.round(time);
}

export default function OrderMap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerLocation, setCustomerLocation] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/delivery/order/${id}`);
      setOrder(res.data.order);
      
      if (res.data.order.delivery_latitude && res.data.order.delivery_longitude) {
        setCustomerLocation([
          parseFloat(res.data.order.delivery_latitude),
          parseFloat(res.data.order.delivery_longitude)
        ]);
      }
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  const distance = customerLocation 
    ? calculateDistance(STORE_LOCATION[0], STORE_LOCATION[1], customerLocation[0], customerLocation[1])
    : null;
  const estimatedTime = distance ? getEstimatedTime(distance) : null;

  const mapCenter = customerLocation 
    ? [
        (STORE_LOCATION[0] + customerLocation[0]) / 2,
        (STORE_LOCATION[1] + customerLocation[1]) / 2
      ]
    : STORE_LOCATION;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 z-50">
        <button onClick={() => navigate('/orders')} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-xs text-gray-500">Delivery Route</p>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <Marker position={STORE_LOCATION} icon={storeIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold">Grocy-Mart Store</p>
                <p className="text-sm text-gray-500">Trichy, Tamil Nadu</p>
              </div>
            </Popup>
          </Marker>

          {customerLocation && (
            <>
              <Marker position={customerLocation} icon={customIcon}>
                <Popup>
                  <div className="text-center p-2">
                    <p className="font-bold">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.delivery_address?.split(',')[0]}</p>
                  </div>
                </Popup>
              </Marker>
              
              <Polyline
                positions={[STORE_LOCATION, customerLocation]}
                color="#22c55e"
                weight={4}
                opacity={0.7}
                dashArray="10, 10"
              />
            </>
          )}
        </MapContainer>

        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          {distance && (
            <div className="flex items-center justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{distance} km</p>
                <p className="text-xs text-gray-400">Distance</p>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-green-600">~{estimatedTime} min</p>
                <p className="text-xs text-gray-400">Est. Time</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
            <p className="text-sm text-green-100 font-medium">Your Earnings for this Delivery</p>
            <p className="text-3xl font-bold">₹{parseFloat(order.partner_earnings || order.delivery_fee || 50).toFixed(0)}</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-white font-bold">
                {order.customer_name?.charAt(0) || 'C'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{order.customer_name}</p>
                <p className="text-sm text-gray-500">{order.customer_phone}</p>
              </div>
              <a href={`tel:${order.customer_phone}`} className="p-3 bg-green-500 rounded-xl shadow-lg">
                <Phone className="w-5 h-5 text-white" />
              </a>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
              <MapPin className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{order.delivery_address}</p>
            </div>
          </div>

          {order.status === 'out_for_delivery' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
              <p className="text-amber-600 text-sm font-medium">Ask customer for OTP to complete delivery</p>
            </div>
          )}

          <a 
            href={`https://www.google.com/maps/dir/?api=1&origin=${STORE_LOCATION[0]},${STORE_LOCATION[1]}&destination=${encodeURIComponent(order.delivery_address)}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Navigation className="w-5 h-5" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
