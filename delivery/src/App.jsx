import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryOrders from './pages/delivery/Orders';
import DeliveryEarnings from './pages/delivery/Earnings';
import DeliveryHistory from './pages/delivery/History';
import DeliverySettings from './pages/delivery/Settings';
import OrderMap from './pages/delivery/OrderMap';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user || user.role !== 'delivery') return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><DeliveryDashboard /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><DeliveryOrders /></ProtectedRoute>} />
          <Route path="/order/:id/map" element={<ProtectedRoute><OrderMap /></ProtectedRoute>} />
          <Route path="/earnings" element={<ProtectedRoute><DeliveryEarnings /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><DeliveryHistory /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DeliverySettings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" toastOptions={{
          style: { 
            fontFamily: 'system-ui, sans-serif', 
            borderRadius: '16px', 
            fontSize: '14px', 
            padding: '12px 16px',
            background: '#ffffff',
            color: '#374151',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          },
          success: { 
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: { 
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
