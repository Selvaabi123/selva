import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

const defaultLocation = [10.7905, 78.7041];

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

function MapEventsHandler({ onLocationSelect }) {
  const map = useMapEvents({
    click: (e) => {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [map, center]);
  return null;
}

export default function LocationPicker({ onLocationChange, onLocationDetails }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const isMounted = useRef(true);

  const handleLocationSelect = useCallback(async (latlng) => {
    if (!isMounted.current) return;
    
    setSelectedLocation(latlng);
    setGpsError(null);
    onLocationChange?.(latlng);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng[0]}&lon=${latlng[1]}`
      );
      const data = await response.json();
      const address = data.display_name;
      if (isMounted.current) {
        setLocationDetails(address);
        onLocationDetails?.(address);
      }
    } catch {
      if (isMounted.current) {
        const coords = `${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`;
        setLocationDetails(coords);
        onLocationDetails?.(coords);
      }
    }
  }, [onLocationChange, onLocationDetails]);

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported in your browser');
      return;
    }
    setLoadingGPS(true);
    setGpsError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationSelect([latitude, longitude]);
        setLoadingGPS(false);
      },
      (error) => {
        setLoadingGPS(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Location permission denied. Please allow location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Location unavailable. Please try again.');
            break;
          case error.TIMEOUT:
            setGpsError('Location request timed out. Please try again.');
            break;
          default:
            setGpsError('Unable to get location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    isMounted.current = true;
    if (!selectedLocation) {
      handleGPSLocation();
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  const mapCenter = selectedLocation || defaultLocation;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden" style={{ height: '350px' }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler onLocationSelect={handleLocationSelect} />
          {selectedLocation && (
            <>
              <Marker position={selectedLocation} icon={customIcon} />
              <MapUpdater center={selectedLocation} />
            </>
          )}
        </MapContainer>
      </div>
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGPSLocation}
          disabled={loadingGPS}
          className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loadingGPS ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              Use My GPS Location
            </>
          )}
        </button>
      </div>

      {gpsError && (
        <p className="text-sm text-red-500 text-center">{gpsError}</p>
      )}

      <p className="text-sm text-gray-500 text-center">
        Tap on the map to select your delivery location
      </p>

      {locationDetails && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Selected Location:</h4>
          <p className="text-sm text-gray-600">{locationDetails}</p>
          <div className="mt-2 flex gap-4 text-xs text-gray-400 font-mono">
            <span>Lat: {selectedLocation[0].toFixed(6)}</span>
            <span>Lng: {selectedLocation[1].toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
}