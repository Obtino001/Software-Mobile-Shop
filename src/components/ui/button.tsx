import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none focus:outline-none';

    const variants = {
      primary: 'bg-[#E06349] hover:bg-[#D05339] text-white shadow-[0_4px_12px_rgba(224,99,73,0.22)]',
      secondary: 'bg-[#FAFAFA] hover:bg-slate-100 text-slate-800 border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
      outline: 'border border-black/[0.12] hover:bg-black/[0.03] text-slate-800 bg-white',
      ghost: 'text-slate-600 hover:text-slate-950 hover:bg-black/[0.04]',
      danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-xs gap-2 min-w-[40px]',
      lg: 'h-12 px-6 text-sm gap-2.5 font-bold',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
