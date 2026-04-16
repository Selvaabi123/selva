import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';

const TOTAL_SECONDS = 15;

const TOAST_ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

const TOAST_COLORS = {
  success: { accent: '#22c55e' },
  error: { accent: '#ef4444' },
  warning: { accent: '#f59e0b' },
  info: { accent: '#3b82f6' },
  delete: { accent: '#ef4444' },
};

const TYPE_LABELS = {
  success: 'SUCCESS',
  error: 'ERROR',
  warning: 'WARNING',
  info: 'INFO',
  delete: 'DELETE',
};

const MAX_PREVIEW = 60;

function ExpandableToast({ toast: toastData, onDismiss, onToggleExpand, onConfirm, onCancel }) {
  const { type, title, message } = toastData;
  const [isHovered, setIsHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  
  const timerRef = useRef(null);
  const pausedRef = useRef(false);

  const colors = TOAST_COLORS[type] || TOAST_COLORS.info;
  const progress = (secondsLeft / TOTAL_SECONDS) * 100;
  const preview = message.length > MAX_PREVIEW ? message.slice(0, MAX_PREVIEW) + '...' : message;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          setIsExiting(true);
          setTimeout(() => onDismiss(), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onDismiss, stopTimer]);

  const handleDismiss = useCallback(() => {
    stopTimer();
    setIsExiting(true);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss, stopTimer]);

  const handleConfirm = useCallback(() => {
    stopTimer();
    if (onConfirm) onConfirm();
    setIsExiting(true);
    setTimeout(() => onDismiss(), 300);
  }, [onConfirm, onDismiss, stopTimer]);

  const handleCancel = useCallback(() => {
    stopTimer();
    if (onCancel) onCancel();
    setIsExiting(true);
    setTimeout(() => onDismiss(), 300);
  }, [onCancel, onDismiss, stopTimer]);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [toastData.id]);

  useEffect(() => {
    if (isHovered) {
      stopTimer();
      pausedRef.current = true;
    } else if (pausedRef.current) {
      pausedRef.current = false;
      startTimer();
    }
  }, [isHovered, startTimer, stopTimer]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`toast-item ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      data-type={type}
    >
      <div 
        className="toast-progress-bar"
        style={{ width: `${progress}%` }}
      />
      
      <div className="toast-header">
        <div className="toast-icon" style={{ color: colors.accent }}>
          {TOAST_ICONS[type]}
        </div>
        
        <div className="toast-content">
          <div className="toast-meta">
            <span className="toast-type" style={{ color: colors.accent }}>
              {TYPE_LABELS[type]}
            </span>
            <span className="toast-countdown">
              {secondsLeft}s
            </span>
          </div>
          <h4 className="toast-title">{title}</h4>
        </div>

        <div className="toast-actions">
          <button 
            className="toast-expand-btn"
            onClick={onToggleExpand}
            style={{ color: colors.accent }}
            aria-label="Expand"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          
          <button 
            className="toast-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="toast-body">
        <p className="toast-message">
          {toastData.isExpanded ? message : preview}
        </p>
      </div>

      {toastData.isExpanded && type === 'delete' && (
        <div className="toast-delete-actions">
          <button className="toast-confirm-btn" onClick={handleConfirm}>
            Confirm Delete
          </button>
          <button className="toast-cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast, toggleExpand, settings } = useToast();

  const positionClass = {
    'top-right': 'toast-container-top-right',
    'bottom-right': 'toast-container-bottom-right',
    'bottom-center': 'toast-container-bottom-center',
  }[settings.position] || 'toast-container-top-right';

  return (
    <div className={`toast-container ${positionClass}`}>
      {toasts.map(toast => (
        <ExpandableToast
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
          onToggleExpand={() => toggleExpand(toast.id)}
          onConfirm={toast.onConfirm}
          onCancel={toast.onCancel}
        />
      ))}
    </div>
  );
}

export { TOAST_COLORS, TOAST_ICONS, TYPE_LABELS };
