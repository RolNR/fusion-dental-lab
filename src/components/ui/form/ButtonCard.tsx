'use client';

import { ReactNode } from 'react';
import { Icons } from '@/components/ui/Icons';

interface ButtonCardProps {
  icon?: keyof typeof Icons;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function ButtonCard({
  icon,
  title,
  subtitle,
  selected = false,
  onClick,
  disabled = false,
}: ButtonCardProps) {
  const IconComponent = icon ? Icons[icon] : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex min-h-[100px] w-full flex-col items-center justify-center gap-2
        rounded-lg border-2 p-4 transition-all
        ${
          selected
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background hover:border-primary/50'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      {selected && (
        <div className="absolute right-3 top-3">
          <Icons.check size={20} className="text-primary" />
        </div>
      )}

      {IconComponent && (
        <IconComponent size={32} className={selected ? 'text-primary' : 'text-muted-foreground'} />
      )}

      <div className="text-center">
        <div className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
          {title}
        </div>
        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
      </div>
    </button>
  );
}
