'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = '', ...props }, ref) => {
    const radioId = props.id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    const radioElement = (
      <input
        ref={ref}
        type="radio"
        id={radioId}
        className={`h-4 w-4 border-border text-primary focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="flex items-center gap-2">
          {radioElement}
          <label
            htmlFor={radioId}
            className="text-sm font-medium text-foreground select-none cursor-pointer"
          >
            {label}
          </label>
        </div>
      );
    }

    return radioElement;
  }
);

Radio.displayName = 'Radio';
