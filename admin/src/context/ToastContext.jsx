import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

const TOAST_DEFAULTS = {
  duration: 15000,
  position: 'top-right',
};

const POSITIONS = ['top-right', 'bottom-right', 'bottom-center'];

const getSavedPosition = () => {
  try {
    const saved = localStorage.getItem('toastPosition');
    if (saved && POSITIONS.includes(saved)) return saved;
  } catch (e) { }
  return TOAST_DEFAULTS.position;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState({ position: getSavedPosition() });
  const toastIdRef = useRef(0);

  const addToast = useCallback(({ type = 'info', title, message, duration = TOAST_DEFAULTS.duration, onConfirm, onCancel }) => {
    const id = ++toastIdRef.current;
    const newToast = {
      id,
      type,
      title,
      message,
      duration,
      isExpanded: false,
      timeRemaining: duration,
      onConfirm,
      onCancel,
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const toggleExpand = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExpanded: !t.isExpanded } : t));
  }, []);

  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
    delete: (title, message, callbacks = {}) => addToast({ type: 'delete', title, message, ...callbacks }),
  };

  const setPosition = useCallback((position) => {
    if (POSITIONS.includes(position)) {
      try { localStorage.setItem('toastPosition', position); } catch (e) { }
      setSettings(prev => ({ ...prev, position }));
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast, updateToast, toggleExpand, settings, setPosition }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export { POSITIONS };
export default ToastContext;
