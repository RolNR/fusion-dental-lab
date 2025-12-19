'use client';

import { ReactNode, useEffect } from 'react';
import { Icons } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[calc(100%-2rem)] sm:max-w-md',
    md: 'max-w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg',
    lg: 'max-w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg lg:max-w-2xl',
    xl: 'max-w-[calc(100%-2rem)] sm:max-w-md md:max-w-2xl lg:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={`relative w-full ${sizeClasses[size]} transform rounded-lg bg-background shadow-xl transition-all max-h-[90vh] overflow-y-auto`}
        >
          {/* Header */}
          <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icons.x size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3 sm:px-6 sm:py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
