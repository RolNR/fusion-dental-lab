'use client';

import { Icons } from '@/components/ui/Icons';

interface FieldLabelProps {
  icon?: keyof typeof Icons;
  label: string;
  required?: boolean;
  className?: string;
}

export function FieldLabel({ icon, label, required = false, className = '' }: FieldLabelProps) {
  const IconComponent = icon ? Icons[icon] : null;

  return (
    <label className={`mb-3 flex items-center gap-2 text-sm font-semibold text-foreground ${className}`}>
      {IconComponent && <IconComponent size={18} className="text-primary" />}
      <span>{label}</span>
      {required && <span className="text-danger">*</span>}
    </label>
  );
}
