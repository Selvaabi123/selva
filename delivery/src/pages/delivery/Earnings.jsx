import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, RefreshCw, Package, Home, Clock, Settings, TrendingUp, Calendar, Menu, X, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function DeliveryEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const load = () => {
    setLoading(true);
    api.get('/delivery/earnings').then(r => {
      setEarnings(r.data);
    }).catch(() => {
      toast.error('Failed to load earnings');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-40 flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">SwiftMart</h1>
              <p className="text-xs text-gray-500">Delivery Partner</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === (item.id === 'dashboard' ? '/' : `/${item.id}`);
            const path = item.id === 'dashboard' ? '/' : `/${item.id}`;
            return (
              <button
                key={item.id}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-green-50 text-green-600 font-semibold' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-30">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 bg-gray-100 rounded-xl">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Earnings</h1>
                <p className="text-xs text-gray-500">Track your income</p>
              </div>
            </div>
            <button onClick={load} className="p-2 bg-gray-100 rounded-xl">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-50"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">SwiftMart</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === (item.id === 'dashboard' ? '/' : `/${item.id}`);
                  const path = item.id === 'dashboard' ? '/' : `/${item.id}`;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { navigate(path); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-green-50 text-green-600 font-semibold' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-72 p-4 lg:p-8 pb-24 lg:pb-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg animate-pulse">
                <div className="h-32 bg-gray-100 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : earnings ? (
          <>
            {/* Today's Earnings - Hero Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl lg:rounded-3xl p-6 lg:p-8 mb-4 lg:mb-6 shadow-xl shadow-green-500/30">
              <p className="text-green-100 text-sm lg:text-base font-medium mb-1">Today's Earnings</p>
              <p className="text-white text-4xl lg:text-5xl font-bold">₹{earnings.today?.earnings || 0}</p>
              <p className="text-green-100 text-sm lg:text-base mt-2">{earnings.today?.deliveries || 0} deliveries</p>
            </div>

            {/* Weekly & Monthly */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
              <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-5 shadow-lg shadow-gray-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
                  <p className="text-gray-500 text-xs lg:text-sm font-medium">This Week</p>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">₹{earnings.weekly?.earnings || 0}</p>
                <p className="text-gray-400 text-xs lg:text-sm mt-1">{earnings.weekly?.deliveries || 0} deliveries</p>
              </div>
              <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-5 shadow-lg shadow-gray-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
                  <p className="text-gray-500 text-xs lg:text-sm font-medium">This Month</p>
                </div>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">₹{earnings.monthly?.earnings || 0}</p>
                <p className="text-gray-400 text-xs lg:text-sm mt-1">{earnings.monthly?.deliveries || 0} deliveries</p>
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg shadow-gray-200/50">
              <h3 className="font-bold text-gray-900 text-base lg:text-lg mb-4">Last 7 Days</h3>
              <div className="space-y-3">
                {(earnings.daily || []).map((day, i) => (
                  <div key={i} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-xl lg:rounded-2xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm lg:text-base">
                        {day.date ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}
                      </p>
                      <p className="text-xs lg:text-sm text-gray-400">{day.deliveries || 0} deliveries</p>
                    </div>
                    <p className="text-lg lg:text-xl font-bold text-green-600">₹{day.earnings || 0}</p>
                  </div>
                ))}
                {(!earnings.daily || earnings.daily.length === 0) && (
                  <p className="text-center text-gray-400 py-4">No deliveries yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl lg:rounded-3xl shadow-lg">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300" />
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No earnings data</h3>
            <p className="text-gray-400 text-sm">Complete deliveries to see your earnings</p>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 pb-6 z-40">
        <div className="flex justify-around">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === (item.id === 'dashboard' ? '/' : `/${item.id}`);
            const path = item.id === 'dashboard' ? '/' : `/${item.id}`;
            return (
              <button
                key={item.id}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all ${
                  isActive ? 'bg-green-50' : ''
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
