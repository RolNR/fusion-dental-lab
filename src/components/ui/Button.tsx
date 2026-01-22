import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Icons } from './Icons';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]';

    const widthStyles = fullWidth ? 'w-full' : '';

    const variantStyles = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary shadow-sm hover:shadow-md',
      secondary:
        'bg-secondary/10 text-secondary hover:bg-secondary/20 focus:ring-secondary border border-border',
      danger:
        'bg-danger text-danger-foreground hover:bg-danger-hover focus:ring-danger shadow-sm hover:shadow-md',
      ghost: 'bg-transparent text-foreground hover:bg-muted focus:ring-primary',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Cargando...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
