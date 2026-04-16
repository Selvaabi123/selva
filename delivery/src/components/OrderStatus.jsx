const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-100', text: 'text-blue-700' },
  preparing: { label: 'Preparing', bg: 'bg-orange-100', text: 'text-orange-700' },
  picked: { label: 'Picked Up', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-purple-100', text: 'text-purple-700' },
  delivered: { label: 'Delivered', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
};

export function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
