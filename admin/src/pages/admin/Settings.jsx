import AdminLayout from '../../components/AdminLayout';
import { useToast, POSITIONS } from '../../context/ToastContext';

const POSITION_LABELS = {
  'top-right': 'Top Right',
  'bottom-right': 'Bottom Right',
  'bottom-center': 'Bottom Center',
};

const POSITION_ICONS = {
  'top-right': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  ),
  'bottom-right': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="17" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
  'bottom-center': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
};

export default function Settings() {
  const { settings, setPosition, toast } = useToast();

  const handlePositionChange = (position) => {
    setPosition(position);
    toast.success('Position updated', `Notifications will appear at ${POSITION_LABELS[position]}.`);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Customize your admin experience</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Toast Position
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Choose where notifications appear on your screen
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {POSITIONS.map((position) => (
                  <button
                    key={position}
                    onClick={() => handlePositionChange(position)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      settings.position === position
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`flex flex-col items-center gap-2 ${
                      settings.position === position ? 'text-brand-600' : 'text-gray-500'
                    }`}>
                      {POSITION_ICONS[position]}
                      <span className="text-sm font-medium">{POSITION_LABELS[position]}</span>
                    </div>
                    {settings.position === position && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-brand-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Notifications</h2>
          <p className="text-sm text-gray-500 mb-4">
            Click the buttons below to preview each notification type
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={() => toast.success('Success!', 'Your action was completed successfully.')}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
            >
              Success
            </button>
            <button
              onClick={() => toast.error('Error!', 'Something went wrong. Please try again.')}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
            >
              Error
            </button>
            <button
              onClick={() => toast.warning('Warning!', 'Please review the information below.')}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition"
            >
              Warning
            </button>
            <button
              onClick={() => toast.info('Info', 'Here is some helpful information for you.')}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
            >
              Info
            </button>
            <button
              onClick={() => toast.delete(
                'Delete Item?',
                'Are you sure you want to delete this item? This action cannot be undone.',
                {
                  onConfirm: () => toast.success('Deleted', 'Item has been removed.'),
                  onCancel: () => toast.info('Cancelled', 'Deletion was cancelled.'),
                }
              )}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
            >
              Delete Confirm
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Grocy-Mart Admin</strong></p>
            <p>Version 1.0.0</p>
            <p>Notification system with expandable toasts, 15s auto-dismiss, and position preferences.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
