'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full px-4 py-2.5 bg-background-tertiary border border-border rounded-xl text-foreground text-base transition-all duration-200',
            'focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none',
            'placeholder:text-foreground-muted',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-foreground-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
