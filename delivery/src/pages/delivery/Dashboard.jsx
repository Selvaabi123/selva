import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Phone, Navigation, Package, RefreshCw, Home, Clock, DollarSign, Settings, Menu, X, CheckCircle, Truck, Bell, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import OnlineToggle from '../../components/OnlineToggle';
import OTPModal from '../../components/OTPModal';

const navItems = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const statusSteps = ['pending', 'confirmed', 'preparing', 'picked', 'out_for_delivery', 'delivered'];

const getStepIndex = (status) => {
  if (status === 'ready') return 3;
  if (status === 'picked') return 3;
  if (status === 'picked_up') return 3;
  return statusSteps.indexOf(status);
};

export default function DeliveryDashboard() {
  const { user, logout, isOnline } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [activeTab, setActiveTab] = useState('active');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (isOnline) {
      const updateLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              api.put('/delivery/update-location', {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              }).catch(() => {});
            },
            () => {},
            { enableHighAccuracy: false, timeout: 10000 }
          );
        }
      };
      updateLocation();
      const interval = setInterval(updateLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const load = () => {
    setLoading(true);
    
    // Fetch both active and completed orders
    Promise.all([
      api.get('/delivery/orders'),
      api.get('/delivery/history?limit=100')
    ]).then(([activeRes, historyRes]) => {
      const active = activeRes.data.orders || [];
      const completed = historyRes.data.orders || [];
      
      setOrders(active);
      setCompletedOrders(completed);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Filter today's completed orders
      const todayCompleted = completed.filter(o => {
        const orderDate = o.delivered_at ? new Date(o.delivered_at).toISOString().split('T')[0] : null;
        return o.status === 'delivered' && orderDate === today;
      });
      
      // Calculate today's earnings from partner_earnings field
      const todayEarningsValue = todayCompleted.reduce((sum, o) => {
        return sum + (parseFloat(o.partner_earnings || o.delivery_fee || 0) || 0);
      }, 0);
      
      setTodayEarnings(todayEarningsValue);
      setTotalDeliveries(todayCompleted.length);
    }).catch((err) => {
      console.error('Load error:', err);
      toast.error('Failed to load orders');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      setUpdating(orderId);
      
      // Find the order to get its earnings
      const order = orders.find(o => o.id === orderId);
      const earnings = parseFloat(order?.partner_earnings || order?.delivery_fee || 0);
      
      await api.put('/delivery/update-status', { order_id: orderId, status });
      
      if (status === 'delivered') {
        toast.success('Order delivered successfully!');
        setTodayEarnings(prev => prev + earnings);
        setTotalDeliveries(prev => prev + 1);
      } else {
        toast.success(`Status updated`);
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const openOTPModal = (order) => {
    setSelectedOrder(order);
    setSelectedOrderId(order.id);
    setShowOTPModal(true);
  };

  const handleOTPVerified = () => {
    toast.success('Delivery completed!');
    setShowOTPModal(false);
    setSelectedOrder(null);
    load();
  };

  const activeOrders = orders.filter(o => ['assigned', 'picked', 'out_for_delivery', 'preparing', 'confirmed', 'pending'].includes(o.status));
  const completedDisplay = completedOrders.filter(o => o.status === 'delivered');
  const displayed = activeTab === 'active' ? activeOrders : completedDisplay;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'confirmed': return 'bg-blue-100 text-blue-600';
      case 'preparing': return 'bg-amber-100 text-amber-600';
      case 'picked': return 'bg-orange-100 text-orange-600';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusSteps = (status) => {
    const currentIndex = getStepIndex(status);
    return statusSteps.map((step, i) => ({
      key: step,
      completed: i < currentIndex,
      current: i === currentIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-40 flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.phone}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
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
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Hi, {user?.name?.split(' ')[0] || 'Partner'}</h1>
                <p className="text-xs text-gray-500">Ready to deliver?</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="p-2 bg-gray-100 rounded-xl">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
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
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.phone}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-72 p-4 lg:p-8 pb-24 lg:pb-8">
        {/* Online Status Card */}
        <div className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg shadow-gray-200/50 mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Status</p>
              <h2 className={`text-xl lg:text-2xl font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isOnline ? 'You are receiving orders' : 'Go online to receive orders'}
              </p>
            </div>
            <OnlineToggle />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl lg:rounded-3xl p-4 lg:p-5 shadow-lg shadow-green-500/30">
            <p className="text-green-100 text-xs lg:text-sm font-medium">Today's Earnings</p>
            <p className="text-white text-2xl lg:text-3xl font-bold mt-1">₹{todayEarnings.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-5 shadow-lg shadow-gray-200/50">
            <p className="text-gray-400 text-xs lg:text-sm font-medium">Active</p>
            <p className="text-gray-900 text-2xl lg:text-3xl font-bold mt-1">{activeOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-5 shadow-lg shadow-gray-200/50">
            <p className="text-gray-400 text-xs lg:text-sm font-medium">Total</p>
            <p className="text-gray-900 text-2xl lg:text-3xl font-bold mt-1">{totalDeliveries}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl lg:rounded-3xl p-1.5 shadow-lg shadow-gray-200/50 mb-4 lg:mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'active' 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                : 'text-gray-500'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'completed' 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                : 'text-gray-500'
            }`}
          >
            Completed ({completedDisplay.length})
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg animate-pulse">
                <div className="h-6 bg-gray-200 rounded-xl w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-100 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl lg:rounded-3xl shadow-lg">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 lg:w-12 lg:h-12 text-gray-300" />
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'active' ? 'No active orders' : 'No deliveries yet'}
            </h3>
            <p className="text-gray-400 text-sm">
              {activeTab === 'active' ? 'You\'re all caught up!' : 'Complete your first delivery'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg shadow-gray-200/50"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{order.id}</span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl lg:rounded-2xl px-4 py-2">
                    <p className="text-xs text-green-600 font-medium">Your Earning</p>
                    <p className="text-xl lg:text-2xl font-bold text-green-600">₹{parseFloat(order.partner_earnings || order.delivery_fee || 50).toFixed(0)}</p>
                  </div>
                </div>

                {/* Status Progress */}
                <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2">
                  {getStatusSteps(order.status).map((step, i) => (
                    <div key={step.key} className="flex items-center flex-shrink-0">
                      <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : step.current 
                            ? 'bg-green-100 text-green-600 ring-2 ring-green-500' 
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {step.completed ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      {i < getStatusSteps(order.status).length - 1 && (
                        <div className={`w-4 lg:w-6 h-0.5 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl lg:rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {order.customer_name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{order.customer_name || 'Customer'}</p>
                      <p className="text-sm text-gray-500">{order.customer_phone}</p>
                    </div>
                    <a href={`tel:${order.customer_phone}`} className="p-2.5 bg-green-500 rounded-xl shadow-lg">
                      <Phone className="w-5 h-5 text-white" />
                    </a>
                  </div>

                  {order.delivery_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 line-clamp-2">{order.delivery_address}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Hide when delivered */}
                {order.status !== 'delivered' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/order/${order.id}/map`)}
                      className="flex-1 min-w-[120px] py-3.5 rounded-xl bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-600 transition"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </button>

                    {order.status === 'picked' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                        disabled={updating === order.id}
                        className="flex-1 min-w-[140px] py-3.5 rounded-xl bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-purple-600 transition disabled:opacity-50"
                      >
                        <Truck className="w-4 h-4" />
                        {updating === order.id ? 'Updating...' : 'Start Delivery'}
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => openOTPModal(order)}
                        className="flex-1 min-w-[160px] py-3.5 rounded-xl bg-green-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-green-600 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify & Deliver
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
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

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => { setShowOTPModal(false); setSelectedOrder(null); }}
        onVerified={handleOTPVerified}
        orderId={selectedOrderId}
        orderData={selectedOrder}
      />
    </div>
  );
}

import { LogOut } from 'lucide-react';
