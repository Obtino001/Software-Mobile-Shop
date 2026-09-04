import React, { useEffect, useState, useRef } from 'react';
import { formatPKR } from '../../utils/formatters';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedNumberProps {
  value: number;
  duration?: number; // duration in ms, default 700ms
  isCurrency?: boolean;
  prefix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 750,
  isCurrency = true,
  prefix,
  className = '',
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(() => prefersReducedMotion ? value : 0);
  const startTimestampRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // If reduced motion is preferred, show value immediately
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    startValueRef.current = displayValue;
    startTimestampRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimestampRef.current) {
        startTimestampRef.current = timestamp;
      }

      const elapsed = timestamp - startTimestampRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic: fast initial start, soft landing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValueRef.current + (value - startValueRef.current) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration, prefersReducedMotion]);

  const formatted = isCurrency 
    ? formatPKR(displayValue) 
    : displayValue.toLocaleString();

  return (
    <span className={`inline-block font-mono tracking-tight ${className}`}>
      {prefix ? `${prefix} ` : ''}{formatted}
    </span>
  );
}
