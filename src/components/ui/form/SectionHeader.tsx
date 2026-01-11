'use client';

import { ReactNode } from 'react';
import { Icons } from '@/components/ui/Icons';

interface SectionHeaderProps {
  icon: keyof typeof Icons;
  title: string;
  description: string;
  required?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SectionHeader({
  icon,
  title,
  description,
  required = false,
  isCollapsed = false,
  onToggleCollapse,
}: SectionHeaderProps) {
  const IconComponent = Icons[icon];

  return (
    <div className="flex items-start justify-between gap-4 rounded-t-xl bg-primary px-6 py-4">
      <div className="flex items-start gap-3 flex-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
          <IconComponent size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/90">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {required && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
            Requerido
          </span>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 transition-colors hover:bg-white/30"
            aria-label={isCollapsed ? 'Expandir sección' : 'Contraer sección'}
          >
            <Icons.chevronDown
              size={20}
              className={`text-white transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

SectionHeader.displayName = 'SectionHeader';
