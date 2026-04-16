import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function OnlineToggle() {
  const { isOnline, setIsOnline } = useAuth();
  const [loading, setLoading] = useState(false);
  const blockRef = useRef(false);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true }
      );
    });
  };

  const handleToggle = async () => {
    if (blockRef.current || loading) return;
    
    blockRef.current = true;
    setLoading(true);
    
    try {
      let location = null;
      const newStatus = !isOnline;
      
      // Update UI immediately (optimistic update)
      setIsOnline(newStatus);
      toast(newStatus ? 'Going online...' : 'Going offline...', { icon: '⏳' });
      
      if (!isOnline) {
        try {
          location = await getLocation();
        } catch (locErr) {
          // Rollback if location fails
          setIsOnline(!newStatus);
          toast.error('Location required to go online. Please enable GPS.');
          blockRef.current = false;
          setLoading(false);
          return;
        }
      }
      
      // Call API
      await api.put('/delivery/toggle-online', { 
        is_online: newStatus,
        latitude: location?.latitude,
        longitude: location?.longitude
      });
      
      toast.success(newStatus ? 'You are now online!' : 'You are now offline');
    } catch (err) {
      // Rollback on error
      setIsOnline(!isOnline);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
      setTimeout(() => { blockRef.current = false; }, 2000);
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      className={`relative w-20 h-11 rounded-full transition-all duration-300 ${
        isOnline 
          ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/40' 
          : 'bg-gray-200'
      }`}
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      <motion.div
        initial={false}
        animate={{ x: isOnline ? 44 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1.5 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
      >
        {isOnline ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-3 h-3 bg-green-500 rounded-full"
          />
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-3 h-3 bg-gray-400 rounded-full"
          />
        )}
      </motion.div>
      
      {isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-full bg-green-500/30 blur-md"
        />
      )}
    </motion.button>
  );
}
