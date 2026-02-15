'use client';

import { useToast } from '@/contexts/ToastContext';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg ${
            toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
          } ${
            toast.type === 'success'
              ? 'bg-success text-white'
              : toast.type === 'error'
              ? 'bg-error text-white'
              : 'bg-white text-foreground shadow-md'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <XCircle size={20} />}
          {toast.type === 'info' && <Info size={20} />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
