import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() => {
    // Load from localStorage on initial render
    const stored = localStorage.getItem('deliveryOnline');
    return stored === 'true';
  });

  // Save to localStorage whenever isOnline changes
  useEffect(() => {
    localStorage.setItem('deliveryOnline', isOnline.toString());
  }, [isOnline]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => { 
          setUser(res.data.user); 
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('deliveryOnline');
    setUser(null);
    setIsOnline(false);
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
