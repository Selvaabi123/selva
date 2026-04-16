import { useState, useCallback } from 'react';

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  });

  const confirm = useCallback(({ title, message, onConfirm, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          resolve(true);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
      });
    }).then(result => {
      if (result && onConfirm) onConfirm();
      return result;
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    return false;
  }, []);

  return { confirm, closeConfirm, confirmState };
}
