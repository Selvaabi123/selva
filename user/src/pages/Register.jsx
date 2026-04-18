import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '', 
    address: '' 
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const getPasswordStrength = () => {
    const { password } = form;
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { label: '', color: '' },
      { label: 'Weak', color: '#EF4444' },
      { label: 'Fair', color: '#F59E0B' },
      { label: 'Good', color: '#3B82F6' },
      { label: 'Strong', color: '#22C55E' },
      { label: 'Very Strong', color: '#10B981' },
    ];

    return { strength, ...levels[strength] };
  };

  const passwordReqs = [
    { label: 'At least 6 characters', test: () => form.password.length >= 6 },
    { label: 'Contains uppercase letter', test: () => /[A-Z]/.test(form.password) },
    { label: 'Contains a number', test: () => /[0-9]/.test(form.password) },
    { label: 'Contains special character', test: () => /[^A-Za-z0-9]/.test(form.password) },
  ];

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
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
    if (form.phone && !/^[0-9]{10}$/.test(form.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      await register(form);
      toast.success('Account created! Welcome to SwiftMart! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed ❌');
    } finally { setLoading(false); }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #FFF4EB 0%, #F7F7F7 50%)',
      padding: '24px 16px 40px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(255,107,0,0.3)'
          }}>
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>
            Create Account
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            Join SwiftMart and start ordering 🚀
          </p>
        </div>

        {/* Register Form */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          padding: '28px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#1A1A1A', 
                marginBottom: '8px' 
              }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9CA3AF'
                }} />
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={set('name')} 
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 46px',
                    border: `2px solid ${errors.name ? '#EF4444' : '#ECECEC'}`,
                    borderRadius: '14px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    if (!errors.name) e.target.style.borderColor = '#FF6B00';
                  }}
                  onBlur={(e) => {
                    if (!errors.name) e.target.style.borderColor = '#ECECEC';
                  }}
                />
              </div>
              {errors.name && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#1A1A1A', 
                marginBottom: '8px' 
              }}>
                Email Address *
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
                  onChange={set('email')} 
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
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>{errors.email}</p>
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
                Password *
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
                  onChange={set('password')}
                  placeholder="Min 6 characters"
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

              {/* Password Strength Indicator */}
              {form.password && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    marginBottom: '8px' 
                  }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div 
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          backgroundColor: i <= passwordStrength.strength 
                            ? passwordStrength.color 
                            : '#E5E7EB',
                          transition: 'background-color 0.3s'
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ 
                    fontSize: '11px', 
                    color: passwordStrength.color,
                    fontWeight: '600'
                  }}>
                    {passwordStrength.label && `Password strength: ${passwordStrength.label}`}
                  </p>
                </div>
              )}

              {/* Password Requirements */}
              {form.password && (
                <div style={{ 
                  marginTop: '10px',
                  padding: '12px',
                  backgroundColor: '#F7F7F7',
                  borderRadius: '10px'
                }}>
                  {passwordReqs.map((req, i) => (
                    <div 
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: i < passwordReqs.length - 1 ? '6px' : 0
                      }}
                    >
                      {req.test() ? (
                        <Check style={{ width: '14px', height: '14px', color: '#22C55E' }} />
                      ) : (
                        <X style={{ width: '14px', height: '14px', color: '#9CA3AF' }} />
                      )}
                      <span style={{ 
                        fontSize: '11px', 
                        color: req.test() ? '#22C55E' : '#9CA3AF'
                      }}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {errors.password && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>{errors.password}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#1A1A1A', 
                marginBottom: '8px' 
              }}>
                Phone <span style={{ color: '#9CA3AF', fontWeight: '400' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#9CA3AF'
                }} />
                <input 
                  type="tel" 
                  value={form.phone} 
                  onChange={set('phone')} 
                  placeholder="+91 9999999999"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 46px',
                    border: `2px solid ${errors.phone ? '#EF4444' : '#ECECEC'}`,
                    borderRadius: '14px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    if (!errors.phone) e.target.style.borderColor = '#FF6B00';
                  }}
                  onBlur={(e) => {
                    if (!errors.phone) e.target.style.borderColor = '#ECECEC';
                  }}
                />
              </div>
              {errors.phone && (
                <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#1A1A1A', 
                marginBottom: '8px' 
              }}>
                Address <span style={{ color: '#9CA3AF', fontWeight: '400' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '14px',
                  width: '18px',
                  height: '18px',
                  color: '#9CA3AF'
                }} />
                <textarea 
                  value={form.address} 
                  onChange={set('address')} 
                  placeholder="Your delivery address..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 46px',
                    border: '2px solid #ECECEC',
                    borderRadius: '14px',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FF6B00'}
                  onBlur={(e) => e.target.style.borderColor = '#ECECEC'}
                />
              </div>
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
                marginTop: '8px'
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Terms */}
          <p style={{ 
            textAlign: 'center', 
            fontSize: '11px', 
            color: '#9CA3AF',
            marginTop: '16px',
            lineHeight: '1.5'
          }}>
            By creating an account, you agree to our{' '}
            <Link to="/terms" style={{ color: '#FF6B00' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: '#FF6B00' }}>Privacy Policy</Link>
          </p>
        </div>

        {/* Login Link */}
        <p style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          fontSize: '14px',
          color: '#6B7280'
        }}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{
              color: '#FF6B00',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            Sign In
          </Link>
        </p>

        {/* Benefits */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>
            🎁 Benefits of creating an account:
          </p>
          {[
            'Faster checkout',
            'Order tracking',
            'Exclusive offers',
            'Save favorite items'
          ].map((benefit, i) => (
            <div 
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: i < 3 ? '8px' : 0
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#DCFCE7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check style={{ width: '12px', height: '12px', color: '#22C55E' }} />
              </div>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
