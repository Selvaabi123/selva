import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() => {
    const stored = localStorage.getItem('deliveryOnline');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('deliveryOnline', isOnline.toString());
  }, [isOnline]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setUser(res.data.user);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password }, { withCredentials: true });
    const { user } = res.data;
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data, { withCredentials: true });
    const { user } = res.data;
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setIsOnline(false);
    localStorage.removeItem('deliveryOnline');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setIsOnline, isAdmin: user?.role === 'admin', isDelivery: user?.role === 'delivery', isUser: user?.role === 'user', isOnline }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
