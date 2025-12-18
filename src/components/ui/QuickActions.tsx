import Link from 'next/link';
import { Button } from './Button';

interface Action {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

interface QuickActionsProps {
  title?: string;
  actions: Action[];
  columns?: 1 | 2 | 3;
}

export function QuickActions({ title = 'Acciones Rápidas', actions, columns = 3 }: QuickActionsProps) {
  const gridCols = {
    1: 'grid-cols-1 gap-3',
    2: 'grid-cols-1 gap-3 sm:grid-cols-2',
    3: 'grid-cols-1 gap-3 sm:grid-cols-3',
  };

  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      <div className={`grid ${gridCols[columns]}`}>
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button variant={action.variant || 'primary'} className="w-full">
              {action.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
