import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'warning';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-[80] space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'check_circle';
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'warning':
        return 'text-amber-400';
      case 'info':
        return 'text-primary';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="pointer-events-auto flex items-center gap-3 bg-[#131b2e] border border-outline-variant/30 text-on-surface px-4 py-3 rounded-2xl shadow-2xl shadow-black/60 max-w-sm animate-in slide-in-from-top-4 duration-200">
      <span className={`material-symbols-outlined text-lg ${getIconColor()}`}>
        {getIcon()}
      </span>
      <p className="text-xs font-semibold flex-grow">{toast.text}</p>
      <button
        onClick={onDismiss}
        className="text-outline hover:text-white p-1"
        aria-label="Cerrar notificación"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
};
