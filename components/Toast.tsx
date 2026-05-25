import React from 'react';
import EnhancedToast, { type ToastType, type ToastMessage } from './EnhancedToast';

export type { ToastType, ToastMessage };

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 w-80 pointer-events-none">
      {toasts.map((toast) => (
        <EnhancedToast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;