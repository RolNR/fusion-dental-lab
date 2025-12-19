import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  };
  children?: ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Link href={action.href} className="sm:flex-shrink-0">
            <Button variant={action.variant || 'primary'} fullWidth className="sm:w-auto">
              {action.label}
            </Button>
          </Link>
        )}
        {children && <div className="sm:flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
