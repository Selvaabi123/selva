import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: { icon: 'bg-red-100 text-red-600', button: 'bg-red-500 hover:bg-red-600' },
    warning: { icon: 'bg-amber-100 text-amber-600', button: 'bg-amber-500 hover:bg-amber-600' },
    info: { icon: 'bg-blue-100 text-blue-600', button: 'bg-blue-500 hover:bg-blue-600' },
  };

  const styles = typeStyles[type] || typeStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full ${styles.icon} flex items-center justify-center mb-4`}>
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">{cancelText}</button>
          <button onClick={onConfirm} className={`flex-1 ${styles.button} text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
