import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2 select-none">
        <div
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${
            variant === 'danger'
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-[#E06349]/10 border-[#E06349]/20 text-[#E06349]'
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1 tracking-tight">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-xs">{message}</p>

        <div className="flex w-full gap-2.5">
          <Button variant="secondary" className="flex-1 rounded-2xl" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1 rounded-2xl"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
