import { useState, useEffect } from 'react';

export default function NewOrderTimer({ onExpire, onAccept }) {
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    setSecondsLeft(15);
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire && onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const progress = (secondsLeft / 15) * 100;
  const isUrgent = secondsLeft <= 5;
  const isWarning = secondsLeft <= 10 && secondsLeft > 5;

  return (
    <div className="zepto-card p-4 zepto-enter">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: isUrgent ? '#ef4444' : isWarning ? '#eab308' : '#22c55e' }}
          />
          <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>
            New Order Available
          </span>
        </div>
        <div 
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{ 
            backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.2)' : isWarning ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
            color: isUrgent ? '#ef4444' : isWarning ? '#eab308' : '#22c55e'
          }}
        >
          {secondsLeft}s
        </div>
      </div>

      <div className="progress-bar mb-4">
        <div 
          className="progress-fill"
          style={{ 
            width: `${progress}%`,
            background: isUrgent 
              ? 'linear-gradient(90deg, #ef4444, #f87171)' 
              : isWarning 
                ? 'linear-gradient(90deg, #eab308, #facc15)' 
                : 'linear-gradient(90deg, #22c55e, #4ade80)'
          }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
          }}
        >
          Accept Order
        </button>
        <button
          onClick={onExpire}
          className="px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
          style={{
            background: '#262626',
            color: '#737373'
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
