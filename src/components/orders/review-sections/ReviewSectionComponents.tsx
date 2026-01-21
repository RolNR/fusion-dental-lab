/**
 * Shared components for OrderReviewModal sections
 */

import { Icons } from '@/components/ui/Icons';

interface DetailRowProps {
  label: string;
  value?: string | number | null;
  required?: boolean;
}

export function DetailRow({ label, value, required }: DetailRowProps) {
  // If required and no value, show warning
  if (required && !value) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2 border-b border-border last:border-0">
        <dt className="font-semibold text-foreground sm:w-1/3">
          {label}:<span className="text-danger ml-1">*</span>
        </dt>
        <dd className="text-danger sm:w-2/3 flex items-center gap-2">
          <Icons.alertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">Campo requerido - debe completarse</span>
        </dd>
      </div>
    );
  }

  // If not required and no value, don't show the row
  if (!value) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2 border-b border-border last:border-0">
      <dt className="font-semibold text-foreground sm:w-1/3">
        {label}:{required && <span className="text-danger ml-1">*</span>}
      </dt>
      <dd className="text-muted-foreground sm:w-2/3 break-words">{value}</dd>
    </div>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h3 className="text-lg font-bold text-foreground mb-3 mt-6 first:mt-0 pb-2 border-b-2 border-primary">
      {children}
    </h3>
  );
}
