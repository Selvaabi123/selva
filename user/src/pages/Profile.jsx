import { useState } from 'react';
import { 
  User, Mail, Phone, MapPin, Save, Loader2, Shield, 
  ChevronRight, Bell, Lock, HelpCircle, Info, LogOut,
  Heart, CreditCard, Clock, Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import SanitizedText from '../components/SanitizedText';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    address: user?.address || '' 
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/users/profile', form);
      toast.success('Profile updated successfully! ✅');
      setEditing(false);
    } catch { 
      toast.error('Failed to update profile'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const settingsMenu = [
    { icon: Bell, label: 'Notifications', sublabel: 'Manage notifications' },
    { icon: Heart, label: 'Wishlist', sublabel: 'Your saved items' },
    { icon: Clock, label: 'Order History', sublabel: 'View past orders' },
    { icon: Gift, label: 'Offers & Coupons', sublabel: 'Active offers' },
    { icon: CreditCard, label: 'Saved Addresses', sublabel: 'Manage addresses' },
    { icon: Lock, label: 'Change Password', sublabel: 'Update security' },
    { icon: HelpCircle, label: 'Help & Support', sublabel: 'Get help' },
    { icon: Info, label: 'About SwiftMart', sublabel: 'App info' },
  ];

  return (
    <div style={{ backgroundColor: '#F7F7F7', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
        padding: '24px 16px 60px',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>My Profile</h1>
      </div>

      {/* Profile Card */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '-40px auto 0',
        padding: '0 16px' 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)', gap: '20px' }}>
          {/* Left Column - Profile Form */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '20px', 
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            marginBottom: '20px'
          }}>
            {/* Avatar & Name */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
              }}>
                <User style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <SanitizedText 
                  text={user?.name} 
                  as="h2" 
                  style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }} 
                />
                <SanitizedText 
                  text={user?.email} 
                  style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px', display: 'block' }} 
                />
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  backgroundColor: '#FFF4EB',
                  color: '#FF6B00',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '20px'
                }}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: editing ? '#FF6B00' : '#F7F7F7',
                  color: editing ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#1A1A1A', 
                  marginBottom: '8px' 
                }}>
                  Full Name
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
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 46px',
                      border: '2px solid #ECECEC',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: editing ? 'white' : '#F7F7F7'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FF6B00'}
                    onBlur={(e) => e.target.style.borderColor = '#ECECEC'}
                    disabled={!editing}
                    required 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#1A1A1A', 
                  marginBottom: '8px' 
                }}>
                  Email
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
                    value={user?.email} 
                    disabled 
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 46px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      backgroundColor: '#F7F7F7',
                      color: '#6B7280',
                      cursor: 'not-allowed'
                    }} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#1A1A1A', 
                  marginBottom: '8px' 
                }}>
                  Phone
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
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9999999999"
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 46px',
                      border: '2px solid #ECECEC',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: editing ? 'white' : '#F7F7F7'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FF6B00'}
                    onBlur={(e) => e.target.style.borderColor = '#ECECEC'}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#1A1A1A', 
                  marginBottom: '8px' 
                }}>
                  Default Address
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
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Your delivery address"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 46px',
                      border: '2px solid #ECECEC',
                      borderRadius: '12px',
                      fontSize: '15px',
                      outline: 'none',
                      resize: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: editing ? 'white' : '#F7F7F7',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#FF6B00'}
                    onBlur={(e) => e.target.style.borderColor = '#ECECEC'}
                    disabled={!editing}
                  />
                </div>
              </div>

              {editing && (
                <button 
                  type="submit" 
                  disabled={saving} 
                  style={{
                    width: '100%',
                    height: '52px',
                    background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save style={{ width: '20px', height: '20px' }} />
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Security Note */}
            <div style={{ 
              marginTop: '20px',
              padding: '14px',
              backgroundColor: '#F7F7F7',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Shield style={{ width: '18px', height: '18px', color: '#22C55E' }} />
              <p style={{ fontSize: '12px', color: '#6B7280', flex: 1 }}>
                Your personal information is secure and encrypted
              </p>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div>
            {/* Settings Menu */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '20px', 
              padding: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              marginBottom: '20px'
            }}>
              <p style={{ 
                fontSize: '13px', 
                fontWeight: '700', 
                color: '#6B7280',
                padding: '8px 16px',
                marginBottom: '4px'
              }}>
                SETTINGS
              </p>
              {settingsMenu.map(({ icon: Icon, label, sublabel }, i) => (
                <button
                  key={label}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'background-color 0.2s',
                    borderBottom: i < settingsMenu.length - 1 ? '1px solid #F3F4F6' : 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F7F7F7'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#FFF4EB',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon style={{ width: '18px', height: '18px', color: '#FF6B00' }} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{label}</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{sublabel}</p>
                  </div>
                  <ChevronRight style={{ width: '18px', height: '18px', color: '#9CA3AF' }} />
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                backgroundColor: '#FEE2E2',
                color: '#EF4444',
                border: 'none',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <LogOut style={{ width: '18px', height: '18px' }} />
              Logout
            </button>

            {/* App Version */}
            <p style={{ 
              textAlign: 'center', 
              fontSize: '12px', 
              color: '#9CA3AF',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              SwiftMart v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
