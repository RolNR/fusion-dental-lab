interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border transition-all duration-200 hover:shadow-lg">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
