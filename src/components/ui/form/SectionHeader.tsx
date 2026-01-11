'use client';

import { ReactNode } from 'react';
import { Icons } from '@/components/ui/Icons';

interface SectionHeaderProps {
  icon: keyof typeof Icons;
  title: string;
  description: string;
  required?: boolean;
}

export function SectionHeader({ icon, title, description, required = false }: SectionHeaderProps) {
  const IconComponent = Icons[icon];

  return (
    <div className="flex items-start justify-between gap-4 rounded-t-xl bg-primary px-6 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
          <IconComponent size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/90">{description}</p>
        </div>
      </div>
      {required && (
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
          Requerido
        </span>
      )}
    </div>
  );
}
