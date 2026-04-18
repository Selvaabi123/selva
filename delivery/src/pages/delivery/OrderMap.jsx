import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, CheckCircle, RefreshCw, Navigation, Clock, MapPinOff } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/api';
import SanitizedText from '../../components/SanitizedText';

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #ef4444; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const storeIcon = L.divIcon({
  className: 'store-marker',
  html: `<div style="background-color: #22c55e; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20 4H4v2h16M4 18h16v-2H4v2M4 12h16v-2H4v2"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const deliveryPartnerIcon = L.divIcon({
  className: 'partner-marker',
  html: `<div style="background-color: #3b82f6; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 12px rgba(59,130,246,0.5); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
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
  return (R * c).toFixed(2);
}

function getEstimatedTime(distance) {
  const speed = 30;
  const time = (distance / speed) * 60;
  return Math.round(time);
}

function MapBounds({ partnerLocation, customerLocation }) {
  const map = useMap();
  useEffect(() => {
    if (partnerLocation && customerLocation) {
      map.fitBounds([partnerLocation, customerLocation], { padding: [50, 50] });
    } else if (partnerLocation) {
      map.setView(partnerLocation, 14);
    }
  }, [partnerLocation, customerLocation, map]);
  return null;
}

export default function OrderMap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const watchId = useRef(null);

  useEffect(() => {
    loadOrder();
    startLocationTracking();
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [id]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('GPS not supported');
      setLocationLoading(false);
      loadStoredLocation();
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = [pos.coords.latitude, pos.coords.longitude];
        setPartnerLocation(location);
        setLocationError(null);
        setLocationLoading(false);
        api.put('/delivery/update-location', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }).catch(() => {});
      },
      (err) => {
        console.error('Location error:', err);
        if (err.code === 1) {
          setLocationError('GPS permission denied');
        } else {
          setLocationError('GPS unavailable');
        }
        setLocationLoading(false);
        loadStoredLocation();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const loadStoredLocation = async () => {
    try {
      const res = await api.get('/delivery/profile');
      if (res.data.profile.latitude && res.data.profile.longitude) {
        setPartnerLocation([
          parseFloat(res.data.profile.latitude),
          parseFloat(res.data.profile.longitude)
        ]);
      }
    } catch (e) {}
  };

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

  const refreshLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPartnerLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationError(null);
        setLocationLoading(false);
        api.put('/delivery/update-location', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }).catch(() => {});
      },
      () => {
        setLocationError('Unable to refresh location');
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Loading order...</p>
        </div>
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

  const distanceToCustomer = customerLocation && partnerLocation 
    ? calculateDistance(partnerLocation[0], partnerLocation[1], customerLocation[0], customerLocation[1])
    : null;
  const estimatedTime = distanceToCustomer ? getEstimatedTime(distanceToCustomer) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 z-50">
        <button onClick={() => navigate('/orders')} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-xs text-blue-600 font-medium capitalize">{order.status.replace(/_/g, ' ')}</p>
        </div>
        <button onClick={refreshLocation} disabled={locationLoading} className="p-2 bg-green-50 rounded-xl hover:bg-green-100 transition disabled:opacity-50">
          <RefreshCw className={`w-5 h-5 text-green-600 ${locationLoading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {locationError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <MapPinOff className="w-4 h-4 text-amber-600" />
          <p className="text-amber-700 text-sm">{locationError}</p>
        </div>
      )}

      <div className="flex-1 relative">
        <MapContainer
          center={partnerLocation || customerLocation || STORE_LOCATION}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <Marker position={STORE_LOCATION} icon={storeIcon}>
            <Popup>
              <div className="text-center p-2">
                <p className="font-bold">Store</p>
                <p className="text-sm text-gray-500">Trichy</p>
              </div>
            </Popup>
          </Marker>

          {partnerLocation && (
            <Marker position={partnerLocation} icon={deliveryPartnerIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-bold text-blue-600">Your Location</p>
                  <p className="text-xs text-gray-500">{partnerLocation[0].toFixed(5)}, {partnerLocation[1].toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {customerLocation && (
            <Marker position={customerLocation} icon={customIcon}>
              <Popup>
                <div className="text-center p-2">
                  <SanitizedText text={order.customer_name} />
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </Popup>
            </Marker>
          )}

          {partnerLocation && customerLocation && (
            <Polyline
              positions={[partnerLocation, customerLocation]}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
              dashArray="12, 8"
            />
          )}

          <MapBounds partnerLocation={partnerLocation} customerLocation={customerLocation} />
        </MapContainer>

        <button 
          onClick={refreshLocation}
          disabled={locationLoading}
          className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
          {locationLoading ? 'Getting...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[55vh] overflow-y-auto">
        {distanceToCustomer && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white text-center">
              <p className="text-2xl font-bold">{distanceToCustomer}</p>
              <p className="text-xs text-blue-100">KM</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white text-center">
              <p className="text-2xl font-bold">~{estimatedTime}</p>
              <p className="text-xs text-green-100">Minutes</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white text-center">
              <p className="text-2xl font-bold">₹{parseFloat(order.partner_earnings || order.delivery_fee || 50).toFixed(0)}</p>
              <p className="text-xs text-orange-100">Earnings</p>
            </div>
          </div>
        )}

        {partnerLocation && (
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Navigation className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Your Location</p>
              <p className="text-sm font-mono text-gray-700">{partnerLocation[0].toFixed(5)}, {partnerLocation[1].toFixed(5)}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {order.customer_name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1">
              <SanitizedText text={order.customer_name} className="font-semibold text-gray-900" />
              <SanitizedText text={order.customer_phone} className="text-sm text-gray-500 block" />
            </div>
            <a href={`tel:${order.customer_phone}`} className="p-3 bg-green-500 rounded-xl shadow-lg hover:bg-green-600 transition">
              <Phone className="w-5 h-5 text-white" />
            </a>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
            <MapPin className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <SanitizedText text={order.delivery_address} className="text-sm text-gray-600 block" />
          </div>
        </div>

        {order.status === 'out_for_delivery' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">OTP Verification Required</p>
              <p className="text-sm text-amber-600">Ask customer for the 4-digit OTP to complete delivery</p>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/order/${id}`)}
          className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg transition"
        >
          View Order Details
        </button>
      </div>
    </div>
  );
}
