import React from 'react';
import { Card } from './card';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'slate';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  color = 'emerald',
  onClick,
}: StatCardProps) {
  const colorStyles = {
    emerald: 'text-[#E06349] bg-[#E06349]/10 border-[#E06349]/20',
    blue: 'text-sky-600 bg-sky-50 border-sky-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    slate: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative overflow-hidden transition-all duration-200 select-none p-4 bg-white border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
        onClick && 'cursor-pointer hover:border-black/[0.18] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] active:scale-[0.98]',
        highlight && 'border-[#E06349]/30 bg-[#E06349]/[0.02]'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl border', colorStyles[color])}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'flex items-center font-bold font-mono',
                  trend.isPositive ? 'text-[#E06349]' : 'text-rose-500'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-400 text-[11px] truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
