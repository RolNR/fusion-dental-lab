import { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className = '', children, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-semibold text-foreground mb-2">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            className={`block w-full rounded-lg border px-4 py-2.5 pr-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 text-input-foreground bg-input-background appearance-none ${
              error
                ? 'border-danger/50 focus:border-danger focus:ring-danger/20'
                : 'border-border-input focus:border-primary focus:ring-primary/20'
            } disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground hover:border-primary/50 ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-danger font-medium">{error}</p>}
        {helperText && !error && <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
