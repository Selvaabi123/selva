import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import BottomNav from './components/BottomNav';
import DesktopNav from './components/DesktopNav';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#F7F7F7'
    }}>
      <div className="spinner" />
    </div>
  );
  if (!user || user.role !== 'user') return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.role === 'user') return <Navigate to="/" replace />;
  return children;
};

const MainLayout = ({ children, hideBottomNav = false }) => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#F7F7F7'
    }}>
      {/* Desktop Top Navigation */}
      <div className="hide-mobile">
        <DesktopNav />
      </div>
      
      {/* Main Content */}
      <main style={{ 
        flex: 1,
        paddingBottom: hideBottomNav ? '0' : '100px'
      }}>
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <div className="hide-desktop">
          <BottomNav />
        </div>
      )}
    </div>
  );
};

const CheckoutLayout = ({ children }) => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#F7F7F7'
    }}>
      {/* Desktop Top Navigation */}
      <div className="hide-mobile">
        <DesktopNav />
      </div>
      
      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout><Home /></MainLayout>} />
      <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
      <Route path="/products/:id" element={<MainLayout hideBottomNav><ProductDetail /></MainLayout>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/cart" element={<ProtectedRoute><MainLayout><Cart /></MainLayout></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutLayout><Checkout /></CheckoutLayout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><MainLayout><Orders /></MainLayout></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><MainLayout hideBottomNav><OrderDetail /></MainLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: { 
                fontFamily: 'Nunito, sans-serif', 
                borderRadius: '12px', 
                fontSize: '14px', 
                padding: '12px 16px' 
              },
              success: { 
                iconTheme: { primary: '#22C55E', secondary: '#fff' }, 
                style: { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' } 
              },
              error: { 
                iconTheme: { primary: '#EF4444', secondary: '#fff' }, 
                style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' } 
              },
            }} 
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
