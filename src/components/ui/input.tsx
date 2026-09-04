import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixText?: string;
  suffixText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefixText, suffixText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
              {leftIcon}
            </div>
          )}
          {prefixText && (
            <span className="pointer-events-none absolute left-3.5 text-xs font-bold text-[#E06349]">
              {prefixText}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-11 w-full rounded-2xl border border-black/[0.1] bg-white px-3.5 text-xs text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-[#E06349] focus:outline-none focus:ring-4 focus:ring-[#E06349]/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
              leftIcon && 'pl-10',
              prefixText && 'pl-14',
              (rightIcon || suffixText) && 'pr-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 animate-[shake_0.25s_ease-in-out]',
              className
            )}
            {...props}
          />
          {suffixText && (
            <span className="pointer-events-none absolute right-3.5 text-xs font-medium text-slate-400">
              {suffixText}
            </span>
          )}
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[11px] font-medium text-rose-500 animate-in fade-in slide-in-from-top-0.5 duration-150">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-[11px] text-slate-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
