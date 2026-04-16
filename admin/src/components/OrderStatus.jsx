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

const STEPS = ['pending', 'confirmed', 'preparing', 'picked', 'out_for_delivery', 'delivered'];
const STEP_LABELS = { pending: 'Order Placed', confirmed: 'Confirmed', preparing: 'Preparing', picked: 'Picked Up', out_for_delivery: 'On the Way', delivered: 'Delivered' };

export function OrderTimeline({ status }) {
  const idx = STEPS.indexOf(status);
  if (status === 'cancelled') return <div className="text-red-500 font-semibold text-sm">Order Cancelled</div>;
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const done = i <= idx;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${i < idx ? 'bg-brand-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
      <p className="text-xs text-gray-500 mt-1 ml-1">{STEP_LABELS[status]}</p>
    </div>
  );
}
