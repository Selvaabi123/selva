const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#B45309' },
  confirmed: { label: 'Confirmed', bg: '#DBEAFE', text: '#1D4ED8' },
  preparing: { label: 'Preparing', bg: '#FFEDD5', text: '#C2410C' },
  picked: { label: 'Picked Up', bg: '#EDE9FE', text: '#6D28D9' },
  out_for_delivery: { label: 'On the Way', bg: '#EDE9FE', text: '#6D28D9' },
  delivered: { label: 'Delivered', bg: '#DCFCE7', text: '#15803D' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#DC2626' },
};

export function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#F3F4F6', text: '#374151' };
  return (
    <span style={{
      display: 'inline-flex',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: config.bg,
      color: config.text
    }}>
      {config.label}
    </span>
  );
}

const STEPS = ['pending', 'confirmed', 'preparing', 'picked', 'out_for_delivery', 'delivered'];
const STEP_LABELS = { 
  pending: 'Order Placed', 
  confirmed: 'Confirmed', 
  preparing: 'Preparing', 
  picked: 'Picked Up', 
  out_for_delivery: 'On the Way', 
  delivered: 'Delivered' 
};

export function OrderTimeline({ status }) {
  const idx = STEPS.indexOf(status);
  if (status === 'cancelled') return (
    <div style={{ 
      color: '#DC2626', 
      fontWeight: '600', 
      fontSize: '14px',
      padding: '12px',
      backgroundColor: '#FEE2E2',
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      ⚠️ Order Cancelled
    </div>
  );
  
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {STEPS.map((step, i) => {
          const done = i <= idx;
          const isCurrent = i === idx;
          
          return (
            <div 
              key={step} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1,
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Line behind */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  left: '50%',
                  width: '100%',
                  height: '3px',
                  backgroundColor: done ? '#FF6B00' : '#E5E7EB',
                  zIndex: -1
                }} />
              )}
              
              {/* Circle */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: done ? '#FF6B00' : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                color: done ? 'white' : '#9CA3AF',
                border: isCurrent ? '3px solid #FF9A3C' : 'none',
                boxShadow: isCurrent ? '0 0 0 4px rgba(255,107,0,0.2)' : 'none'
              }}>
                {done ? '✓' : i + 1}
              </div>
              
              {/* Label */}
              <span style={{ 
                fontSize: '9px', 
                color: done ? '#FF6B00' : '#9CA3AF',
                fontWeight: isCurrent ? '700' : '500',
                marginTop: '6px',
                textAlign: 'center',
                maxWidth: '50px'
              }}>
                {step === 'pending' ? 'Placed' : 
                 step === 'confirmed' ? 'Confirmed' :
                 step === 'preparing' ? 'Preparing' :
                 step === 'picked' ? 'Picked' :
                 step === 'out_for_delivery' ? 'On Way' :
                 'Delivered'}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Current Status Text */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#FFF4EB',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <p style={{ 
          fontSize: '13px', 
          fontWeight: '600', 
          color: '#FF6B00',
          margin: 0
        }}>
          {idx === STEPS.length - 1 
            ? '🎉 Your order has been delivered!' 
            : `Your order is ${STEP_LABELS[status]?.toLowerCase()}`
          }
        </p>
      </div>
    </div>
  );
}
