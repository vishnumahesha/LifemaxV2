'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'accent',
  size = 'md',
  showLabel = false,
  label,
  className,
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const variants = {
    default: 'bg-foreground-muted',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    accent: 'bg-accent',
  };
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1.5 text-sm">
          <span className="text-foreground-muted">{label}</span>
          {showLabel && (
            <span className="text-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-background-tertiary rounded-full overflow-hidden', sizes[size])}>
        <motion.div
          className={cn('h-full rounded-full', variants[variant])}
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
