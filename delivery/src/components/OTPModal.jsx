import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function OTPModal({ isOpen, onClose, onVerified, orderId, orderData }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '']);
      setError('');
      setSuccess(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d) && newOtp.join('').length === 4) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 4) newOtp[i] = char;
    });
    setOtp(newOtp);
    
    if (pastedData.length === 4) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpValue) => {
    if (!orderId) {
      setError('No order selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/delivery/verify-otp', { order_id: orderId, otp: otpValue });
      const data = response.data;

      if (data.success && data.verified) {
        setSuccess(true);
        setTimeout(() => {
          onVerified();
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Invalid OTP');
        setOtp(['', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setOtp(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const earnings = parseFloat(orderData?.partner_earnings || orderData?.delivery_fee || 50);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Lock className="w-8 h-8 text-green-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900">OTP Verification</h2>
              <p className="text-sm text-gray-500 mt-1">Order #{orderId}</p>
            </div>

            {/* Earnings Display */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 mb-6 text-center shadow-lg shadow-green-500/30"
            >
              <p className="text-green-100 text-sm font-medium">Your Earnings for this Delivery</p>
              <p className="text-white text-3xl font-bold mt-1">₹{earnings.toFixed(0)}</p>
            </motion.div>

            {/* Instruction */}
            <p className="text-sm text-gray-500 text-center mb-4">
              Ask the customer for the 4-digit code
            </p>

            {/* OTP Input */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading || success}
                  className="w-14 h-16 text-center text-2xl font-bold rounded-2xl bg-gray-100 border-2 border-gray-200 focus:border-green-500 focus:bg-white transition-all"
                  animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 mb-4 p-3 bg-red-50 rounded-xl border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                  </motion.div>
                  <p className="text-xl font-bold text-green-600">Delivery Confirmed!</p>
                  <p className="text-sm text-gray-500">₹{earnings.toFixed(0)} added to your earnings</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {loading && !success && (
              <div className="flex justify-center">
                <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Footer */}
            <p className="text-xs text-center text-gray-400 mt-6">
              Enter the OTP shown on customer's screen
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
