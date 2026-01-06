import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost';
  className?: string;
  showIcon?: boolean;
}

export function LogoutButton({ variant = 'default', className = '', showIcon = false }: LogoutButtonProps) {
  const baseClasses = 'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger inline-flex items-center gap-2';

  const variantClasses = {
    default: 'bg-danger text-danger-foreground hover:bg-danger-hover shadow-sm active:scale-[0.98]',
    ghost: 'text-danger hover:bg-danger/10',
  };

  return (
    <Link
      href="/auth/signout"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {showIcon && <Icons.logOut className="h-4 w-4" />}
      <span>Cerrar sesión</span>
    </Link>
  );
}
