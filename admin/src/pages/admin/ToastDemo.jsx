import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import ToastContainer from '../../components/ToastContainer';
import { useToast } from '../../context/ToastContext';

const POSITIONS = [
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-center', label: 'Bottom Center' },
];

export default function ToastDemo() {
  const { toast, settings, setPosition } = useToast();
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);

  const triggerSuccess = () => {
    toast.success('Order Placed!', 'Your order #12345 has been successfully placed and is being prepared.');
  };

  const triggerError = () => {
    toast.error('Payment Failed', 'Unable to process payment. Please check your card details and try again.');
  };

  const triggerWarning = () => {
    toast.warning('Low Stock Alert', 'Chicken Biryani is running low on inventory. Only 3 items remaining.');
  };

  const triggerInfo = () => {
    toast.info('New Update', 'SwiftMart v2.0 is now available with improved performance and new features!');
  };

  const triggerDelete = () => {
    const deleteId = Date.now();
    setSelectedDeleteId(deleteId);
    toast.delete(
      'Confirm Deletion',
      'Are you sure you want to delete Chicken Biryani? This action cannot be undone and all related data will be permanently removed from the system.',
      {
        onConfirm: () => console.log('Confirmed delete for item:', deleteId),
        onCancel: () => console.log('Delete cancelled for item:', deleteId),
      }
    );
  };

  const triggerLongMessage = () => {
    toast.success(
      'Operation Completed',
      'The batch operation has been successfully completed. All 47 items have been processed and the results have been exported to your downloads folder in CSV format.'
    );
  };

  const triggerMultiple = () => {
    toast.success('Success', 'Item saved successfully');
    setTimeout(() => toast.info('FYI', 'A backup was created automatically'), 500);
    setTimeout(() => toast.warning('Reminder', 'Your subscription expires in 3 days'), 1000);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Toast Notification System</h1>
          <p className="text-gray-500">Click the buttons below to see different toast types in action</p>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Position Settings</h2>
          <div className="flex gap-3">
            {POSITIONS.map(pos => (
              <button
                key={pos.value}
                onClick={() => setPosition(pos.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  settings.position === pos.value
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Success Toast</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">For successful operations like order placement, saving data, etc.</p>
            <button onClick={triggerSuccess} className="btn-primary w-full">
              Trigger Success
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Error Toast</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">For failed operations like payment errors, network issues, etc.</p>
            <button onClick={triggerError} className="btn-primary w-full bg-red-500 hover:bg-red-600">
              Trigger Error
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Warning Toast</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">For important alerts like low stock, expiring items, etc.</p>
            <button onClick={triggerWarning} className="btn-primary w-full bg-amber-500 hover:bg-amber-600">
              Trigger Warning
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Info Toast</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">For general information like updates, reminders, etc.</p>
            <button onClick={triggerInfo} className="btn-primary w-full bg-blue-500 hover:bg-blue-600">
              Trigger Info
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Delete Toast</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Interactive confirmation with inline Confirm/Cancel buttons.</p>
            <button onClick={triggerDelete} className="btn-primary w-full bg-red-500 hover:bg-red-600">
              Trigger Delete
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Long Message</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Test with messages exceeding 60 characters preview limit.</p>
            <button onClick={triggerLongMessage} className="btn-primary w-full">
              Trigger Long Message
            </button>
          </div>

          <div className="card p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">Multiple Toasts</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Test stacking multiple toasts vertically without overlapping.</p>
            <button onClick={triggerMultiple} className="btn-primary w-full bg-purple-500 hover:bg-purple-600">
              Trigger Multiple
            </button>
          </div>
        </div>

        <div className="card p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
          <ul className="space-y-3">
            {[
              '15-second auto-dismiss with live countdown',
              'Animated progress bar showing time remaining',
              'Timer pauses on hover, resumes on mouse leave',
              'Expandable with chevron button (max 60 chars preview)',
              '5 types: success, error, warning, info, delete',
              'Delete type has inline Confirm/Cancel buttons',
              '3 position options: top-right, bottom-right, bottom-center',
              'Smooth slide-in/slide-out animations',
              'High contrast dark theme with glowing accents',
              'Multiple toasts stack vertically',
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ToastContainer />
    </AdminLayout>
  );
}
