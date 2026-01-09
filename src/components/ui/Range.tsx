'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

export interface RangeProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  showValue?: boolean;
  valueLabel?: string;
}

export const Range = forwardRef<HTMLInputElement, RangeProps>(
  ({ label, error, helperText, showValue = true, valueLabel, className = '', ...props }, ref) => {
    const minLabel = props.min !== undefined ? `${props.min}` : '0';
    const maxLabel = props.max !== undefined ? `${props.max}` : '100';
    const currentValue = props.value !== undefined ? `${props.value}` : minLabel;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-semibold text-foreground mb-2">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div className="space-y-2">
          <input
            ref={ref}
            type="range"
            className={`w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
          />

          {showValue && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{valueLabel ? `${valueLabel} ${minLabel}` : minLabel}</span>
              <span className="font-semibold text-foreground">
                {valueLabel ? `${valueLabel} ${currentValue}` : currentValue}
              </span>
              <span>{valueLabel ? `${valueLabel} ${maxLabel}` : maxLabel}</span>
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-danger font-medium">{error}</p>}
        {helperText && !error && <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

Range.displayName = 'Range';
