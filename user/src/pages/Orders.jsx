import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, MapPin, RefreshCw, CheckCircle, XCircle, ChefHat, Bike, Home } from 'lucide-react';
import api from '../utils/api';
import { OrderStatusBadge } from '../components/OrderStatus';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: '#3B82F6', bg: '#DBEAFE' },
  preparing: { label: 'Preparing', icon: ChefHat, color: '#F97316', bg: '#FFEDD5' },
  picked: { label: 'Picked Up', icon: Bike, color: '#8B5CF6', bg: '#EDE9FE' },
  out_for_delivery: { label: 'On the Way', icon: Bike, color: '#8B5CF6', bg: '#EDE9FE' },
  delivered: { label: 'Delivered', icon: Home, color: '#22C55E', bg: '#DCFCE7' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#EF4444', bg: '#FEE2E2' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const r = await api.get('/orders/user');
      setOrders(r.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(o => {
        if (activeFilter === 'active') {
          return ['pending', 'confirmed', 'preparing', 'picked', 'out_for_delivery'].includes(o.status);
        }
        if (activeFilter === 'completed') {
          return ['delivered'].includes(o.status);
        }
        return o.status === activeFilter;
      });

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'delivered', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const activeCount = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'picked', 'out_for_delivery'].includes(o.status)
  ).length;

  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F7F7F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #FF6B00',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    </div>
  );

  if (orders.length === 0) return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F7F7F7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <div style={{
          width: '140px',
          height: '140px',
          backgroundColor: '#FFF4EB',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Package style={{ width: '64px', height: '64px', color: '#FF9A3C' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>
          No orders yet 📦
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px' }}>
          When you place an order, it will appear here
        </p>
        <Link 
          to="/products" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #FF6B00 0%, #FF9A3C 100%)',
            color: 'white',
            fontWeight: '700',
            padding: '16px 32px',
            borderRadius: '16px',
            fontSize: '16px',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
          }}
        >
          Start Ordering <ChevronRight style={{ width: '18px', height: '18px' }} />
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F7F7F7', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#FFF4EB',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package style={{ width: '22px', height: '22px', color: '#FF6B00' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A' }}>My Orders</h1>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>{orders.length} total orders</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#F7F7F7',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ 
              width: '18px', 
              height: '18px', 
              color: '#6B7280',
              animation: refreshing ? 'spin 1s linear infinite' : 'none'
            }} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', maxWidth: '1200px', margin: '0 auto' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeFilter === tab.id ? '#FF6B00' : '#F7F7F7',
                color: activeFilter === tab.id ? 'white' : '#6B7280'
              }}
            >
              {tab.label}
              {tab.id === 'active' && activeCount > 0 && (
                <span style={{
                  marginLeft: '4px',
                  padding: '2px 6px',
                  backgroundColor: activeFilter === tab.id ? 'rgba(255,255,255,0.3)' : '#FF6B00',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '10px'
                }}>
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              No {activeFilter !== 'all' ? activeFilter : ''} orders found
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;
            
            return (
              <Link 
                key={order.id} 
                to={`/orders/${order.id}`}
                style={{
                  display: 'block',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '12px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {/* Top Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>
                      Order #{order.id}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      {new Date(order.created_at).toLocaleString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: statusInfo.bg,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <StatusIcon style={{ width: '12px', height: '12px', color: statusInfo.color }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: '#F7F7F7',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '-8px' }}>
                    {order.items?.slice(0, 3).map((item, i) => (
                      <img 
                        key={i}
                        src={item.image_url || 'https://picsum.photos/50'}
                        alt={item.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid white',
                          marginLeft: i > 0 ? '-8px' : 0
                        }}
                        onError={(e) => { e.target.src = 'https://picsum.photos/50'; }}
                      />
                    ))}
                    {order.items?.length > 3 && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#FF6B00',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                        marginLeft: '-8px'
                      }}>
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#6B7280', flex: 1 }}>
                    {order.items?.slice(0, 2).map(i => i.name).join(', ')}
                    {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                  </span>
                </div>

                {/* Bottom Row */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #F3F4F6'
                }}>
                  <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Tap to view details</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A' }}>
                      ₹{parseFloat(order.total_price).toFixed(0)}
                    </span>
                    <ChevronRight style={{ width: '18px', height: '18px', color: '#9CA3AF' }} />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
