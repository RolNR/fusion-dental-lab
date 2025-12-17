interface StatsCardProps {
  title: string;
  value: number | string;
}

export function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-background shadow border border-border">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dt className="text-sm font-medium text-muted-foreground">{title}</dt>
            <dd className="mt-1 text-3xl font-semibold text-foreground">{value}</dd>
          </div>
        </div>
      </div>
    </div>
  );
}
