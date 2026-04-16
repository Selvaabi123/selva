import toast from 'react-hot-toast';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const toastService = {
  success: (message) => toast.success(message, {
    duration: 3000,
    position: 'top-right',
  }),

  error: (message) => toast.error(message, {
    duration: 4000,
    position: 'top-right',
  }),

  info: (message) => toast(message, {
    duration: 3000,
    position: 'top-right',
  }),

  loading: (message) => toast.loading(message, {
    position: 'top-right',
  }),

  dismiss: (t) => toast.dismiss(t),

  custom: (message, options = {}) => toast(message, {
    duration: 3000,
    position: 'top-right',
    ...options,
  }),

  actions: {
    created: (item) => toast.success(`${capitalize(item)} created successfully!`, { duration: 3000 }),
    updated: (item) => toast.success(`${capitalize(item)} updated successfully!`, { duration: 3000 }),
    deleted: (item) => toast.success(`${capitalize(item)} deleted successfully!`, { duration: 3000 }),
    saved: (item) => toast.success(`${capitalize(item)} saved successfully!`, { duration: 3000 }),
    
    createFailed: (item) => toast.error(`Failed to create ${item}. Please try again.`, { duration: 4000 }),
    updateFailed: (item) => toast.error(`Failed to update ${item}. Please try again.`, { duration: 4000 }),
    deleteFailed: (item) => toast.error(`Failed to delete ${item}. Please try again.`, { duration: 4000 }),
    saveFailed: (item) => toast.error(`Failed to save ${item}. Please try again.`, { duration: 4000 }),
    
    loginSuccess: () => toast.success('Welcome back!', { duration: 2000 }),
    logoutSuccess: () => toast.success('Logged out successfully', { duration: 2000 }),
    orderPlaced: () => toast.success('Order placed successfully!', { duration: 3000 }),
    
    error: (message) => toast.error(message, { duration: 4000 }),
  },

  promise: (promise, messages = {}) => toast.promise(promise, {
    loading: messages.loading || 'Loading...',
    success: messages.success || 'Done!',
    error: messages.error || 'Something went wrong',
  }, {
    position: 'top-right',
  }),
};

export default toastService;
