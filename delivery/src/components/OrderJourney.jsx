import { useState, useEffect } from 'react';
import { Package, MapPin, CheckCircle } from 'lucide-react';

const JOURNEY_STEPS = [
  { id: 'ready', label: 'Ready for Pickup', icon: Package },
  { id: 'picked', label: 'Picked Up', icon: Package },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderJourney({ currentStatus, onStatusUpdate, isNewOrder = false }) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  
  useEffect(() => {
    if (!isNewOrder) return;
    
    setSecondsLeft(15);
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isNewOrder]);

  const getStepStatus = (stepId) => {
    const statusOrder = ['ready', 'picked', 'out_for_delivery', 'arrived', 'delivered'];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepId);
    
    if (currentStatus === 'arrived') {
      if (stepId === 'out_for_delivery') return 'active';
      if (stepId === 'delivered') return 'pending';
      return 'completed';
    }
    
    if (stepIdx <= currentIdx) return 'completed';
    if (stepIdx === currentIdx + 1) return 'active';
    return 'pending';
  };

  const getTimerClass = () => {
    if (secondsLeft > 10) return 'success';
    if (secondsLeft > 5) return 'warning';
    return '';
  };

  const canProceed = (stepId) => {
    if (stepId === 'picked' && currentStatus === 'ready') return true;
    if (stepId === 'out_for_delivery' && (currentStatus === 'picked' || currentStatus === 'arrived')) return true;
    if (stepId === 'delivered' && currentStatus === 'out_for_delivery') return true;
    return false;
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      {isNewOrder && (
        <div className="mb-4">
          <div 
            className={`timer-badge ${getTimerClass()}`}
            style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>New Order - Accept within {secondsLeft}s</span>
          </div>
        </div>
      )}
      
      <p className="text-sm font-semibold mb-4 text-gray-400">Delivery Journey</p>
      
      <div className="space-y-0">
        {JOURNEY_STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          const isLast = index === JOURNEY_STEPS.length - 1;
          
          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Timeline: Dot + Line */}
              <div className="flex flex-col items-center w-6 flex-shrink-0">
                {/* Dot */}
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${status === 'completed' ? 'bg-orange-500 text-white' : ''}
                  ${status === 'active' ? 'bg-orange-500 text-white animate-pulse' : ''}
                  ${status === 'pending' ? 'bg-gray-600 text-gray-400' : ''}
                `}>
                  {status === 'completed' ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : status === 'active' ? (
                    <Icon className="w-3 h-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Vertical Line */}
                {!isLast && (
                  <div className={`w-[2px] h-8 ${status === 'completed' ? 'bg-orange-500' : 'bg-gray-700'}`} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-4">
                <p className={`text-sm font-medium ${
                  status === 'completed' ? 'text-white' : 
                  status === 'active' ? 'text-orange-400' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {status === 'active' && (
                  <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
                )}
                {status === 'completed' && (
                  <p className="text-xs text-orange-500 mt-0.5">Completed</p>
                )}
              </div>
              
              {/* Action Button */}
              {status === 'active' && canProceed(step.id) && (
                <button
                  onClick={() => onStatusUpdate && onStatusUpdate(step.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#ffffff',
                  }}
                >
                  {step.label.split(' ')[0]}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}