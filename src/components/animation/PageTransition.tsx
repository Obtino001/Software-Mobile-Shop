import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
  pageKey?: string;
  className?: string;
}

export function PageTransition({
  children,
  pageKey,
  className = '',
}: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{
        duration: 0.2, // 200ms
        ease: [0.25, 1, 0.5, 1], // easeOutQuart
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
