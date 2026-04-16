import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

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
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!user || user.role !== 'user') return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.role === 'user') return <Navigate to="/" replace />;
  return children;
};

const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/products" element={<Layout><Products /></Layout>} />
      <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/cart" element={<ProtectedRoute><Layout><Cart /></Layout></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Layout><Checkout /></Layout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetail /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
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
          <Toaster position="top-right" toastOptions={{
            style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', fontSize: '14px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' }, style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
          }} />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
