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
  color?: 'emerald' | 'rose' | 'coral' | 'blue' | 'purple' | 'amber' | 'slate';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  color = 'slate',
  onClick,
}: StatCardProps) {
  const colorStyles = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    rose: 'text-rose-600 bg-rose-50 border-rose-200/80',
    coral: 'text-[#E06349] bg-[#E06349]/10 border-[#E06349]/20',
    blue: 'text-blue-600 bg-blue-50 border-blue-200/80',
    purple: 'text-purple-600 bg-purple-50 border-purple-200/80',
    amber: 'text-amber-600 bg-amber-50 border-amber-200/80',
    slate: 'text-slate-600 bg-slate-100 border-slate-200/80',
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative overflow-hidden transition-all duration-200 select-none p-4 md:p-5 bg-white border border-slate-200/80 shadow-sm',
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-md active:scale-[0.98]',
        highlight && 'border-[#E06349]/40 bg-[#E06349]/[0.02]'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
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
