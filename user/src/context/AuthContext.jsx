import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitializing = useRef(true);

  useEffect(() => {
    if (!isInitializing.current) return;
    isInitializing.current = false;

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          console.error('Auth check failed:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password }, { withCredentials: true });
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data, { withCredentials: true });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      isAdmin: user?.role === 'admin',
      isDelivery: user?.role === 'delivery',
      isUser: user?.role === 'user'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
