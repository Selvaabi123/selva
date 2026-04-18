import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, X } from 'lucide-react';
import api from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import { OrderStatusBadge, OrderTimeline } from '../../components/OrderStatus';
import SanitizedText from '../../components/SanitizedText';
import { useToast } from '../../context/ToastContext';

const STATUSES = ['pending','confirmed','preparing','picked','out_for_delivery','delivered','cancelled'];

const formatStatus = (status) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const intervalRef = useRef(null);

  const load = useCallback(() => {
    const url = filterStatus ? `/orders?status=${filterStatus}` : '/orders';
    Promise.all([api.get(url), api.get('/delivery/partners')]).then(([o, p]) => {
      setOrders(o.data.orders || []);
      setPartners(p.data.partners || []);
    }).catch(() => {
      toast.error('Failed to load orders', 'Please refresh the page.');
    }).finally(() => setLoading(false));
  }, [filterStatus, toast]);

  useEffect(() => { 
    setLoading(true);
    load();
    intervalRef.current = setInterval(load, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const handleStatusUpdate = async (orderId, status, delivery_partner_id) => {
    try {
      setUpdating(true);
      await api.put(`/orders/${orderId}/status`, { status, delivery_partner_id });
      toast.info('Status updated', `Order #${orderId} is now ${formatStatus(status)}.`);
      load();
      if (selected?.id === orderId) setSelected(prev => ({ ...prev, status, delivery_partner_id }));
    } catch (err) {
      toast.error('Update failed', err.response?.data?.message || 'Could not update order status.');
    } finally { setUpdating(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gray-900">Orders ({orders.length})</h2>
          <div className="flex gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="input text-sm py-2 w-auto">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <button onClick={load} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase hidden sm:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase hidden lg:table-cell">Partner</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? [...Array(6)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                )) : orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelected(order)}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">#{order.id}</p>
                      <p className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="font-medium text-gray-700">{order.customer_name}</p>
                      <p className="text-gray-400 text-xs">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-600">₹{parseFloat(order.total_price).toFixed(0)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{order.delivery_partner_name || '—'}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <select value={order.status} onChange={e => handleStatusUpdate(order.id, e.target.value, order.delivery_partner_id)}
                        disabled={updating} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400">
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && orders.length === 0 && <div className="text-center py-10 text-gray-400">No orders found</div>}
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-display font-bold text-lg">Order #{selected.id}</h3>
                <OrderStatusBadge status={selected.status} />
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[400px]">
                  <OrderTimeline status={selected.status} />
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Customer</h4>
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                  <p className="font-medium">{selected.customer_name}</p>
                  <p className="text-gray-500">{selected.customer_email}</p>
                  <p className="text-gray-500">{selected.customer_phone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Items</h4>
                <div className="space-y-2">
                  {selected.items?.filter(i => i.name).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="font-bold">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-sm pt-2">
                    <span>Total</span>
                    <span className="text-brand-600">₹{parseFloat(selected.total_price).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Assign Delivery Partner</h4>
                <select
                  defaultValue={selected.delivery_partner_id || ''}
                  onChange={e => handleStatusUpdate(selected.id, selected.status, e.target.value || null)}
                  className="input text-sm">
                  <option value="">Not assigned</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone}) {p.is_online ? '🟢 Online' : '⚫ Offline'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Update Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => handleStatusUpdate(selected.id, s, selected.delivery_partner_id)}
                      disabled={updating || selected.status === s || s === 'delivered'}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${selected.status === s ? 'bg-brand-500 text-white border-brand-500' : s === 'delivered' ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 hover:border-brand-300 text-gray-600'}`}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {selected.delivery_partner_name && ['picked', 'out_for_delivery'].includes(selected.status) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-blue-700 mb-2">Delivery Partner</h4>
                  <p className="text-sm text-blue-600">Partner: {selected.delivery_partner_name}</p>
                  {selected.status === 'out_for_delivery' && (
                    <p className="text-xs text-blue-500 mt-2">OTP verification will be done by delivery partner at customer's door</p>
                  )}
                </div>
              )}

              {selected.delivery_address && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Delivery Address</h4>
                  <SanitizedText text={selected.delivery_address} className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 block" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
