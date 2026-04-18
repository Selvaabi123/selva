import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, ShoppingBag, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/categories').catch(() => {});
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 🎉`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed ❌');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    toast.error('Google login coming soon! 🚀');
  };

  const handleBiometricLogin = () => {
    toast.error('Biometric login coming soon! 🚀');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #FFF4EB 0%, #F7F7F7 50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(255,107,0,0.3)'
          }}>
            <svg width="36" height="36" fill="white" viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            Sign in to your SwiftMart account
          </p>
        </div>

        {/* Login Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          padding: '32px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#1A1A1A', 
                marginBottom: '8px' 
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9CA3AF'
                }} />
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => {
                    setForm({ ...form, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 46px',
                    border: `2px solid ${errors.email ? '#EF4444' : '#ECECEC'}`,
                    borderRadius: '14px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    if (!errors.email) e.target.style.borderColor = '#FF6B00';
                  }}
                  onBlur={(e) => {
                    if (!errors.email) e.target.style.borderColor = '#ECECEC';
                  }}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#1A1A1A', 
                marginBottom: '8px' 
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9CA3AF'
                }} />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={form.password}
                  onChange={e => {
                    setForm({ ...form, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '14px 46px 14px 46px',
                    border: `2px solid ${errors.password ? '#EF4444' : '#ECECEC'}`,
                    borderRadius: '14px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    if (!errors.password) e.target.style.borderColor = '#FF6B00';
                  }}
                  onBlur={(e) => {
                    if (!errors.password) e.target.style.borderColor = '#ECECEC';
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF'
                  }}
                >
                  {showPass ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right' }}>
              <Link 
                to="/forgot-password" 
                style={{
                  fontSize: '13px',
                  color: '#FF6B00',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              style={{
                height: '52px',
                background: loading 
                  ? '#FF9A3C' 
                  : 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                border: 'none',
                borderRadius: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            margin: '24px 0' 
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          </div>

          {/* Social Login Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                height: '52px',
                backgroundColor: 'white',
                border: '2px solid #E5E7EB',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#1A1A1A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleBiometricLogin}
              style={{
                height: '52px',
                backgroundColor: 'white',
                border: '2px solid #E5E7EB',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#1A1A1A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <Fingerprint style={{ width: '20px', height: '20px', color: '#FF6B00' }} />
              Login with Biometrics
            </button>
          </div>
        </div>

        {/* Register Link */}
        <p style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          fontSize: '14px',
          color: '#6B7280'
        }}>
          Don't have an account?{' '}
          <Link 
            to="/register" 
            style={{
              color: '#FF6B00',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            Create Account
          </Link>
        </p>

        {/* Terms */}
        <p style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          fontSize: '11px',
          color: '#9CA3AF'
        }}>
          By signing in, you agree to our{' '}
          <Link to="/terms" style={{ color: '#FF6B00' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" style={{ color: '#FF6B00' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
