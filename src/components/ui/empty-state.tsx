import React from 'react';
import { PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-black/[0.08] bg-white my-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <motion.div
        animate={prefersReducedMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E06349]/10 text-[#E06349] mb-3 border border-[#E06349]/20"
      >
        {icon || <PackageOpen className="h-7 w-7" />}
      </motion.div>
      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h4>
      <p className="mt-1 max-w-xs text-xs text-slate-400 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} className="mt-4 bg-[#E06349] hover:bg-[#D05339] text-white rounded-2xl text-xs h-9 px-4" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
}

export function LoadingSpinner({ text = 'Loading records...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E06349] border-t-transparent" />
      <span className="mt-3 text-xs font-semibold text-slate-400">{text}</span>
    </div>
  );
}
