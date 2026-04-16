import ConfirmModal from '../components/ConfirmModal';

export default function ConfirmProvider({ children, confirmState, closeConfirm }) {
  return (
    <>
      {children}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
    </>
  );
}
