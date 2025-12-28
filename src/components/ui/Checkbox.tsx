'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    const checkboxElement = (
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        className={`h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="flex items-center gap-2">
          {checkboxElement}
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-foreground select-none cursor-pointer"
          >
            {label}
          </label>
        </div>
      );
    }

    return checkboxElement;
  }
);

Checkbox.displayName = 'Checkbox';
