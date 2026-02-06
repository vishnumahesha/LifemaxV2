'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-background-tertiary via-background-secondary to-background-tertiary bg-[length:200%_100%] rounded-lg',
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-background-secondary border border-border rounded-2xl p-6 space-y-4', className)}>
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function SkeletonScoreCircle({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-20 h-20',
    md: 'w-30 h-30',
    lg: 'w-40 h-40',
  };
  
  return <Skeleton className={cn('rounded-full', sizes[size])} />;
}
