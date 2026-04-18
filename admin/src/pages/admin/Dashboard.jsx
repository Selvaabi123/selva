import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Package, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { OrderStatusBadge } from '../../components/OrderStatus';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchAnalytics = useCallback(() => {
    api.get('/orders/analytics')
      .then(r => setAnalytics(r.data.analytics))
      .catch(err => console.error('Failed to fetch analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
    intervalRef.current = setInterval(fetchAnalytics, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAnalytics]);

  const stats = analytics ? [
    { label: 'Total Orders', value: analytics.totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', change: 'All time' },
    { label: 'Total Revenue', value: `₹${parseFloat(analytics.totalRevenue).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-green-50 text-green-600', change: 'Paid orders' },
    { label: 'Customers', value: analytics.totalUsers, icon: Users, color: 'bg-purple-50 text-purple-600', change: 'Registered users' },
    { label: 'Products', value: analytics.totalProducts, icon: Package, color: 'bg-orange-50 text-orange-600', change: 'In catalogue' },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-400 text-sm mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="card p-5 animate-pulse h-28" />)
          ) : stats.map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-display text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-gray-500 text-xs mt-1 font-medium">{label}</p>
              <p className="text-gray-300 text-xs">{change}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {analytics?.ordersByStatus?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-display font-bold text-base mb-4">Orders by Status</h3>
              <div className="space-y-3">
                {analytics.ordersByStatus.map(({ status, count }) => (
                  <div key={status} className="flex items-center justify-between">
                    <OrderStatusBadge status={status} />
                    <span className="font-bold text-gray-900 text-sm">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics?.recentOrders?.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-base">Recent Orders</h3>
                <Link to="/orders" className="text-brand-500 text-xs font-semibold hover:text-brand-600 flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {analytics.recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">#{order.id} · {order.customer}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <OrderStatusBadge status={order.status} />
                      <p className="text-xs font-bold text-gray-900 mt-1">₹{parseFloat(order.total_price).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-base mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { to: '/products', label: 'Add Product', icon: Package, color: 'bg-blue-500' },
              { to: '/orders', label: 'Manage Orders', icon: ShoppingBag, color: 'bg-green-500' },
              { to: '/categories', label: 'Categories', icon: Package, color: 'bg-purple-500' },
              { to: '/users', label: 'Manage Users', icon: Users, color: 'bg-orange-500' },
            ].map(({ to, label, icon: Icon, color }) => (
              <Link key={to} to={to}
                className={`${color} text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition text-center`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
