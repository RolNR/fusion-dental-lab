import { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-semibold text-foreground mb-2">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`block w-full rounded-lg border px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 text-input-foreground placeholder:text-input-placeholder ${
            error
              ? 'border-danger/50 focus:border-danger focus:ring-danger/20'
              : 'border-border-input focus:border-primary focus:ring-primary/20'
          } disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground hover:border-primary/50 ${className}`}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-danger font-medium">{error}</p>}
        {helperText && !error && <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
