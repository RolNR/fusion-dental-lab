/**
 * Shared components for OrderReviewModal sections
 */

interface DetailRowProps {
  label: string;
  value?: string | number | null;
}

export function DetailRow({ label, value }: DetailRowProps) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-2 border-b border-border last:border-0">
      <dt className="font-semibold text-foreground sm:w-1/3">{label}:</dt>
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
