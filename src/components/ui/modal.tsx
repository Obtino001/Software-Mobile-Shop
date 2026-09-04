import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <>
      {/* Backdrop — pure opacity, no blur */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 ease-out',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Dialog — CSS scale + opacity, GPU-accelerated */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 select-none',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'relative flex max-h-[90vh] w-full flex-col rounded-3xl bg-white shadow-2xl border border-black/[0.08] will-change-transform transition-all duration-150 ease-out',
            isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2',
            maxWidths[maxWidth]
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-black/[0.06]">
            <div>
              {title && (
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-black/[0.04] hover:text-slate-700 active:scale-90 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 [-webkit-overflow-scrolling:touch]">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-black/[0.06] bg-[#FAFAFA] px-6 py-3.5 rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
