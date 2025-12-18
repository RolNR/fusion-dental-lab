interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  description?: string;
}

export function StatsCard({ title, value, icon, description }: StatsCardProps) {
  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border transition-all duration-200 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
