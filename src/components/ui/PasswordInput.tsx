'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Button } from './Button';
import { Icons } from './Icons';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={`mt-1 block w-full rounded-md border px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-1 text-input-foreground placeholder:text-input-placeholder ${
              error
                ? 'border-danger/50 focus:border-danger focus:ring-danger'
                : 'border-border-input focus:border-primary focus:ring-primary'
            } disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${className}`}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 !px-3 !text-muted-foreground hover:!text-foreground hover:!bg-transparent"
            tabIndex={-1}
          >
            {showPassword ? (
              <Icons.eyeOff size={20} className="mt-1" />
            ) : (
              <Icons.eye size={20} className="mt-1" />
            )}
          </Button>
        </div>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
