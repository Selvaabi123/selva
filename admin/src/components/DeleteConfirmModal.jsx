import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

const TIMER_DURATION = 15000;

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setProgress(100);
    setIsExiting(false);

    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, TIMER_DURATION - elapsed);
      const newProgress = (remaining / TIMER_DURATION) * 100;
      setProgress(newProgress);

      if (remaining <= 0) {
        clearInterval(intervalId);
        handleClose();
      }
    }, 50);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 200);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm();
    handleClose();
  }, [onConfirm, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${isExiting ? 'animate-scale-out' : 'animate-scale-in'}`}>
        <div 
          className="h-1 bg-gray-100"
        >
          <div 
            className="h-full bg-green-500 transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-lg text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button 
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-sm"
          >
            Delete
          </button>
        </div>

        <div className="absolute bottom-4 right-6 text-xs text-gray-400">
          {Math.ceil(progress / 100 * 15)}s
        </div>
      </div>
    </div>
  );
}
