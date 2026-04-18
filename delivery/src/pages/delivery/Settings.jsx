import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Settings, LogOut, Package, Home, DollarSign, Clock, Menu, X, HelpCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function DeliverySettings() {
  const { user, logout, isOnline } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
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
            onClick={handleLogout}
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
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Settings</h1>
                <p className="text-xs text-gray-500">Manage your account</p>
              </div>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-72 p-4 lg:p-8 pb-24 lg:pb-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-lg shadow-gray-200/50 mb-4 lg:mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl lg:text-3xl text-white font-bold shadow-lg">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 text-lg lg:text-xl">{user?.name || 'Delivery Partner'}</h2>
              <p className="text-sm text-gray-500">{user?.phone || '-'}</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full mt-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 lg:p-4 bg-gray-50 rounded-xl">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm lg:text-base font-medium text-gray-900">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 lg:p-4 bg-gray-50 rounded-xl">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm lg:text-base font-medium text-gray-900">{user?.phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden mb-4 lg:mb-6">
          <button className="w-full flex items-center gap-4 p-4 lg:p-5 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Help & Support</p>
              <p className="text-xs lg:text-sm text-gray-400">Get help with your account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-4 p-4 lg:p-5 hover:bg-gray-50 transition border-b border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">About</p>
              <p className="text-xs lg:text-sm text-gray-400">Version 1.0.0</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 lg:p-5 hover:bg-red-50 transition"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-600">Logout</p>
              <p className="text-xs lg:text-sm text-red-400">Sign out of your account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs lg:text-sm text-gray-400">SwiftMart Delivery Partner</p>
          <p className="text-xs text-gray-300 mt-1">Version 1.0.0</p>
        </div>
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

import { Mail, Phone, ChevronRight } from 'lucide-react';
