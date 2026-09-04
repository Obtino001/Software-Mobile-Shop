import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedProgressBarProps {
  value: number; // current value
  max?: number; // max value, default 100
  label?: string;
  showPercentage?: boolean;
  className?: string;
  criticalThreshold?: number; // percentage at which budget is critical, default 90%
}

export function AnimatedProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  className = '',
  criticalThreshold = 90,
}: AnimatedProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const percentage = Math.min(Math.round((value / (max || 1)) * 100), 100);
  const [widthPercentage, setWidthPercentage] = useState<number>(() => prefersReducedMotion ? percentage : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setWidthPercentage(percentage);
      return;
    }

    // Smooth entry animation from 0 to percentage
    const timer = setTimeout(() => {
      setWidthPercentage(percentage);
    }, 50);

    return () => clearTimeout(timer);
  }, [percentage, prefersReducedMotion]);

  const isCritical = percentage >= criticalThreshold;
  const isOverBudget = percentage >= 100;

  // Determine bar color based on status
  let barColor = 'bg-[#E06349]';
  if (isOverBudget) {
    barColor = 'bg-rose-500';
  } else if (isCritical) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-slate-600">{label}</span>}
          {showPercentage && (
            <span className={`font-mono ${isCritical ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06] relative">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} ${
            isCritical ? 'ring-1 ring-rose-500/30' : ''
          }`}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>

      {isCritical && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 pt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <span>{isOverBudget ? 'Budget limit exceeded' : 'Budget limit approaching critical threshold'}</span>
        </div>
      )}
    </div>
  );
}
