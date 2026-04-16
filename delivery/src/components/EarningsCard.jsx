import { useState, useEffect } from 'react';

export default function EarningsCard({ todayEarnings = 0, totalDeliveries = 0, totalRating = 0 }) {
  return (
    <div className="earnings-card zepto-enter">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm" style={{ color: '#737373' }}>Today's Earnings</p>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" style={{ color: '#eab308' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: '#eab308' }}>
            {totalRating > 0 ? totalRating.toFixed(1) : '4.5'}
          </span>
        </div>
      </div>
      
      <div className="earnings-amount">
        ₹{todayEarnings.toFixed(0)}
      </div>
      
      <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #262626' }}>
        <div className="stats-card flex-1 !p-3">
          <div className="stats-value" style={{ fontSize: '18px', color: '#22c55e' }}>
            {totalDeliveries}
          </div>
          <div className="stats-label">Deliveries</div>
        </div>
        <div className="stats-card flex-1 !p-3">
          <div className="stats-value" style={{ fontSize: '18px' }}>
            ₹{totalDeliveries > 0 ? (todayEarnings / totalDeliveries).toFixed(0) : 0}
          </div>
          <div className="stats-label">Avg/Delivery</div>
        </div>
      </div>
    </div>
  );
}
