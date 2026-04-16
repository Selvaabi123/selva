import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const ISSUE_TYPES = [
  { id: 'customer_not_available', label: 'Customer not available', icon: '🚪' },
  { id: 'wrong_address', label: 'Wrong address', icon: '📍' },
  { id: 'address_unreachable', label: 'Address unreachable', icon: '🛣️' },
  { id: 'customer_refused', label: 'Customer refused delivery', icon: '🙅' },
  { id: 'food_spilled', label: 'Food spilled/damaged', icon: '🍔' },
  { id: 'traffic_delay', label: 'Traffic delay', icon: '🚦' },
  { id: 'vehicle_issue', label: 'Vehicle issue', icon: '🛵' },
  { id: 'store_delay', label: 'Store delay', icon: '⏰' },
  { id: 'order_wrong', label: 'Order incorrect', icon: '❌' },
  { id: 'other', label: 'Other issue', icon: '📝' },
];

export default function IssueReportModal({ isOpen, onClose, orderId, onReported }) {
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select an issue type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/delivery/report-issue', {
        order_id: orderId,
        issue_type: selectedType,
        description: description.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onReported?.();
        onClose();
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setDescription('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#1a1a1a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)' }}>
                  <AlertTriangle className="w-5 h-5 text-[#eab308]" />
                </div>
                <h2 className="text-lg font-bold text-white">Report Issue</h2>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-[#262626] transition">
                <X className="w-5 h-5" style={{ color: '#737373' }} />
              </button>
            </div>

            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <CheckCircle className="w-16 h-16 text-[#22c55e] mb-4" />
                </motion.div>
                <p className="text-lg font-semibold text-white">Issue Reported!</p>
                <p className="text-sm mt-2" style={{ color: '#a3a3a3' }}>
                  We have noted your concern and will review it shortly.
                </p>
              </motion.div>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: '#a3a3a3' }}>
                  Select the issue you're facing with Order #{orderId}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {ISSUE_TYPES.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        setSelectedType(issue.id);
                        setError('');
                      }}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        backgroundColor: selectedType === issue.id ? 'rgba(234, 179, 8, 0.2)' : '#262626',
                        border: selectedType === issue.id ? '1px solid #eab308' : '1px solid transparent',
                      }}
                    >
                      <span className="text-xl mb-1 block">{issue.icon}</span>
                      <span className="text-xs font-medium" style={{ color: selectedType === issue.id ? '#eab308' : '#a3a3a3' }}>
                        {issue.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium block mb-2" style={{ color: '#737373' }}>
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    className="w-full p-3 rounded-xl text-sm resize-none"
                    style={{ 
                      backgroundColor: '#262626', 
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl flex items-center gap-2"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-500">{error}</p>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                    style={{ backgroundColor: '#262626', color: '#a3a3a3' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedType}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#eab308', color: '#000' }}
                  >
                    {loading ? 'Reporting...' : 'Report Issue'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
