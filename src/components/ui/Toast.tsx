'use client';

import { useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { DEFAULT_TOAST_DURATION } from '@/lib/constants';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({
  id,
  message,
  type = 'info',
  duration = DEFAULT_TOAST_DURATION,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success/90 border-success text-white';
      case 'warning':
        return 'bg-warning/90 border-warning text-white';
      case 'error':
        return 'bg-danger/90 border-danger text-white';
      case 'info':
      default:
        return 'bg-info/90 border-info text-white';
    }
  };

  return (
    <div
      className={`
        ${getTypeStyles()}
        rounded-lg border-l-4 p-4 shadow-lg
        animate-slide-in-right
        max-w-sm w-full
        flex items-start justify-between gap-3
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0"
        aria-label="Cerrar notificación"
      >
        <Icons.x size={20} />
      </button>
    </div>
  );
}
