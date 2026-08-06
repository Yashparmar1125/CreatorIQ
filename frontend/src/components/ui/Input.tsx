import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'h-9 w-full rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900',
          'placeholder:text-neutral-400',
          'focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/10',
          icon && 'pl-9 pr-3',
          !icon && 'px-3',
          className
        )}
        {...props}
      />
    </div>
  )
);

Input.displayName = 'Input';
