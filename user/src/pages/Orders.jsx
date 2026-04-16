import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { OrderStatusBadge } from '../components/OrderStatus';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/user').then(r => setOrders(r.data.orders || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="card p-5 animate-pulse h-28" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center page-enter">
      <div className="text-6xl mb-4">📦</div>
      <h2 className="font-display text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
      <p className="text-gray-400 mb-6">Start ordering your favourite food!</p>
      <Link to="/products" className="btn-primary inline-block">Browse Menu</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <Link key={order.id} to={`/orders/${order.id}`}
            className="card p-5 flex items-center justify-between hover:shadow-md transition group">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Order #{order.id}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {order.items?.filter(i => i.name).slice(0, 2).map(i => i.name).join(', ')}
                  {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <OrderStatusBadge status={order.status} />
              <p className="font-bold text-gray-900 text-sm">₹{parseFloat(order.total_price).toFixed(0)}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
