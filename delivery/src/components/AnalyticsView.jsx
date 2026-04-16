import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Package, Star, X } from 'lucide-react';
import api from '../utils/api';

export default function AnalyticsView({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/delivery/earnings');
      setData(response.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getBarHeight = (value, max) => {
    if (!max || max === 0) return 0;
    return Math.max(10, (value / max) * 100);
  };

  const maxEarnings = data?.daily?.length > 0 
    ? Math.max(...data.daily.map(d => parseFloat(d.earnings) || 0))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <header className="sticky top-0 z-30 px-4 py-4" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Analytics</h1>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#1a1a1a] transition">
            <X className="w-5 h-5" style={{ color: '#737373' }} />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: '#1a1a1a' }} />
            ))}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                    <DollarSign className="w-4 h-4 text-[#22c55e]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#737373' }}>Today</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(data?.today?.earnings)}</p>
                <p className="text-xs mt-1" style={{ color: '#525252' }}>{data?.today?.deliveries || 0} deliveries</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)' }}>
                    <Calendar className="w-4 h-4 text-[#eab308]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#737373' }}>This Week</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(data?.weekly?.earnings)}</p>
                <p className="text-xs mt-1" style={{ color: '#525252' }}>{data?.weekly?.deliveries || 0} deliveries</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                    <TrendingUp className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#737373' }}>This Month</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(data?.monthly?.earnings)}</p>
                <p className="text-xs mt-1" style={{ color: '#525252' }}>{data?.monthly?.deliveries || 0} deliveries</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <Star className="w-4 h-4 text-[#a855f7]" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#737373' }}>Rating</span>
                </div>
                <p className="text-2xl font-bold text-white">{data?.performance?.rating || '4.8'}</p>
                <p className="text-xs mt-1" style={{ color: '#525252' }}>Your performance</p>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl mb-6"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Earnings Trend</h3>
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#262626', color: '#737373' }}>
                  Last 7 days
                </span>
              </div>

              <div className="flex items-end gap-2 h-32">
                {data?.daily?.length > 0 ? (
                  data.daily.map((day, index) => {
                    const height = getBarHeight(parseFloat(day.earnings), maxEarnings);
                    const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{ 
                            height: `${height}%`,
                            backgroundColor: index === 0 ? '#22c55e' : 'rgba(34, 197, 94, 0.3)'
                          }}
                        />
                        <span className="text-xs" style={{ color: '#525252' }}>{dayName}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Package className="w-8 h-8 mb-2" style={{ color: '#262626' }} />
                    <span className="text-sm" style={{ color: '#525252' }}>No data yet</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Performance Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-5 rounded-2xl"
              style={{ backgroundColor: '#1a1a1a' }}
            >
              <h3 className="font-semibold text-white mb-4">Performance Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#a3a3a3' }}>Total Deliveries</span>
                  <span className="font-semibold text-white">{data?.performance?.completed_orders || 0}</span>
                </div>
                <div className="h-px" style={{ backgroundColor: '#262626' }} />
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#a3a3a3' }}>Total Trips</span>
                  <span className="font-semibold text-white">{data?.performance?.total_trips || 0}</span>
                </div>
                <div className="h-px" style={{ backgroundColor: '#262626' }} />
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#a3a3a3' }}>Total Earnings</span>
                  <span className="font-semibold text-[#22c55e]">{formatCurrency(data?.performance?.total_earnings)}</span>
                </div>
                <div className="h-px" style={{ backgroundColor: '#262626' }} />
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#a3a3a3' }}>Acceptance Rate</span>
                  <span className="font-semibold text-white">95%</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </motion.div>
  );
}
