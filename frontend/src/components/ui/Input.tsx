import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'app-field h-9 w-full text-sm',
          'focus:outline-none',
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
