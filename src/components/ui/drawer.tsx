import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: DrawerProps) {

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
    xl: 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <>
      {/* Backdrop — pure opacity, NO blur for performance */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ease-out',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet — CSS transform slide, GPU-accelerated */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col md:inset-0 md:items-center md:justify-center',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'relative flex max-h-[92vh] md:max-h-[85vh] w-full flex-col rounded-t-[2rem] md:rounded-3xl bg-white shadow-2xl border-t md:border border-black/[0.08] will-change-transform transition-transform duration-200 ease-out',
            isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-4 md:opacity-0',
            maxWidths[maxWidth]
          )}
          style={{
            transitionProperty: 'transform, opacity',
          }}
        >
          {/* Mobile Drag Handle */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-black/15" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-3 pb-3 border-b border-black/[0.06]">
            <div>
              {title && (
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {title}
                </h2>
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

          {/* Scrollable Content — smooth native scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain [-webkit-overflow-scrolling:touch]">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-black/[0.06] bg-[#FAFAFA] px-6 py-3.5 rounded-b-none md:rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
