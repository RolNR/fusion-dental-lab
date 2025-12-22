'use client';

import { ReactNode, useEffect, useRef } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const previouslyFocused = document.activeElement as HTMLElement;

      // Focus first focusable element in modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements?.[0] as HTMLElement;
      firstFocusable?.focus();

      return () => {
        document.body.style.overflow = 'unset';
        previouslyFocused?.focus();
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-md md:max-w-lg',
    lg: 'sm:max-w-md md:max-w-lg lg:max-w-2xl',
    xl: 'sm:max-w-md md:max-w-2xl lg:max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="hidden sm:block fixed inset-0 bg-foreground/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-start sm:items-center justify-center sm:p-4 md:p-6 relative z-50">
        <div
          ref={modalRef}
          className={`relative w-full ${sizeClasses[size]} transform sm:rounded-lg shadow-xl transition-all min-h-screen sm:min-h-0 sm:my-0 max-h-screen sm:max-h-[90vh] overflow-y-auto overflow-x-hidden`}
          style={{ backgroundColor: 'rgb(var(--color-background))' }}
        >
          {/* Header */}
          <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <h3
                id="modal-title"
                className="text-base sm:text-lg font-semibold text-foreground break-words"
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-2 -mr-2"
                aria-label="Cerrar modal"
              >
                <Icons.x className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 break-words">{children}</div>
        </div>
      </div>
    </div>
  );
}
