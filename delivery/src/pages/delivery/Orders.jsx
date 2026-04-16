import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, RefreshCw, LogOut, MapPin, Phone, Navigation, Menu, X, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function DeliveryOrders() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
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
    
    // Fetch both active and completed orders
    Promise.all([
      api.get('/delivery/orders'),
      api.get('/delivery/history?limit=100')
    ]).then(([activeRes, historyRes]) => {
      const active = activeRes.data.orders || [];
      const completed = historyRes.data.orders || [];
      
      // Combine both for display
      const allOrders = [...active, ...completed];
      setOrders(allOrders);
    }).catch(() => {
      toast.error('Failed to load orders');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const displayed = activeTab === 'active' ? activeOrders : completedOrders;

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
              <h1 className="font-bold text-gray-900 text-lg">Grocy-Mart</h1>
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
                <h1 className="font-bold text-gray-900">All Orders</h1>
                <p className="text-xs text-gray-500">{orders.length} total orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="p-2 bg-gray-100 rounded-xl">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="p-2 bg-gray-100 rounded-xl">
                <LogOut className="w-5 h-5 text-red-500" />
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
                  <span className="font-bold text-gray-900">Grocy-Mart</span>
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
            Completed ({completedOrders.length})
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl lg:rounded-3xl p-5 shadow-lg animate-pulse">
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
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(order => (
              <div key={order.id} onClick={() => navigate(`/order/${order.id}/map`)} className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg shadow-gray-200/50 cursor-pointer hover:shadow-xl transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{order.id}</span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-1.5 lg:py-2">
                    <p className="text-xs text-green-600 font-medium">Earning</p>
                    <p className="text-lg lg:text-xl font-bold text-green-600">₹{parseFloat(order.partner_earnings || order.delivery_fee || 50).toFixed(0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {order.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{order.customer_name || 'Customer'}</p>
                    <p className="text-sm text-gray-500">{order.customer_phone}</p>
                  </div>
                </div>

                {order.delivery_address && (
                  <div className="flex items-start gap-2 p-3 lg:p-4 bg-gray-50 rounded-xl lg:rounded-2xl mb-4">
                    <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm lg:text-base text-gray-600 line-clamp-2">{order.delivery_address}</p>
                  </div>
                )}

                {order.status !== 'delivered' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order/${order.id}/map`);
                      }}
                      className="flex-1 min-w-[120px] py-3 rounded-xl bg-blue-50 text-blue-600 font-semibold flex items-center justify-center gap-2 hover:bg-blue-100 transition"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </button>
                  </div>
                )}
              </div>
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
    </div>
  );
}

import { Home, DollarSign, Clock, Settings } from 'lucide-react';
