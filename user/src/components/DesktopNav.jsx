import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Package, ShoppingBag, Home, ChevronDown, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function DesktopNav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/products', label: 'Shop', icon: ShoppingBag },
    { path: '/orders', label: 'Orders', icon: Package },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #E5E7EB',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255,107,0,0.3)'
          }}>
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800' }}>
            <span style={{ color: '#FF6B00' }}>Swift</span>
            <span style={{ color: '#1A1A1A' }}>Mart</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div style={{
          flex: 1,
          maxWidth: '400px',
          margin: '0 40px',
          position: 'relative'
        }}>
          <Search style={{
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
            placeholder="Search for products..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 44px',
              border: '2px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#F7F7F7'
            }}
            onFocus={(e) => e.target.style.borderColor = '#FF6B00'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navLinks.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isActive(path) ? '#FFF4EB' : 'transparent',
                color: isActive(path) ? '#FF6B00' : '#6B7280',
                transition: 'all 0.2s'
              }}
            >
              <Icon style={{ width: '18px', height: '18px' }} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Cart */}
          <Link
            to="/cart"
            style={{
              position: 'relative',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: location.pathname === '/cart' ? '#FF6B00' : '#6B7280'
            }}
          >
            <ShoppingCart style={{ width: '22px', height: '22px' }} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '18px',
                height: '18px',
                backgroundColor: '#FF6B00',
                color: 'white',
                borderRadius: '50%',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: showDropdown ? '#FFF4EB' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                  {user.name?.split(' ')[0]}
                </span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6B7280' }} />
              </button>

              {showDropdown && (
                <>
                  <div 
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 99
                    }}
                    onClick={() => setShowDropdown(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '200px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    zIndex: 100
                  }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>
                        {user.name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
                        {user.email}
                      </p>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <Link
                        to="/profile"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#1A1A1A',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#F7F7F7'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <User style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#EF4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left'
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                color: 'white',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(255,107,0,0.3)'
              }}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
