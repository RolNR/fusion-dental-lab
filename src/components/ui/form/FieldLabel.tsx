'use client';

import { Icons } from '@/components/ui/Icons';

interface FieldLabelProps {
  icon?: keyof typeof Icons;
  label: string;
  required?: boolean;
}

export function FieldLabel({ icon, label, required = false }: FieldLabelProps) {
  const IconComponent = icon ? Icons[icon] : null;

  return (
    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
      {IconComponent && <IconComponent size={18} className="text-primary" />}
      <span>{label}</span>
      {required && <span className="text-danger">*</span>}
    </label>
  );
}
