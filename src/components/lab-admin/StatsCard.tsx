type StatsCardVariant = 'default' | 'success' | 'info' | 'warning' | 'danger';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  description?: string;
  variant?: StatsCardVariant;
}

const variantStyles = {
  default: {
    background: 'bg-background',
    titleColor: 'text-muted-foreground',
    valueColor: 'text-foreground',
    descriptionColor: 'text-muted-foreground',
    border: 'border-border',
  },
  success: {
    background: 'bg-success/10',
    titleColor: 'text-muted-foreground',
    valueColor: 'text-success',
    descriptionColor: 'text-success/70',
    border: 'border-success/20',
  },
  info: {
    background: 'bg-info/10',
    titleColor: 'text-muted-foreground',
    valueColor: 'text-info',
    descriptionColor: 'text-info/70',
    border: 'border-info/20',
  },
  warning: {
    background: 'bg-warning/10',
    titleColor: 'text-muted-foreground',
    valueColor: 'text-warning',
    descriptionColor: 'text-warning/70',
    border: 'border-warning/20',
  },
  danger: {
    background: 'bg-danger/10',
    titleColor: 'text-muted-foreground',
    valueColor: 'text-danger',
    descriptionColor: 'text-danger/70',
    border: 'border-danger/20',
  },
} as const;

export function StatsCard({
  title,
  value,
  icon,
  description,
  variant = 'default',
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`rounded-lg ${styles.background} p-4 shadow-sm border ${styles.border} transition-all duration-200 hover:shadow-md`}
    >
      <p
        className={`text-xs font-semibold ${styles.titleColor} uppercase tracking-wide text-center`}
      >
        {title}
      </p>
      <p className={`mt-2 text-2xl font-bold ${styles.valueColor} text-center`}>{value}</p>
    </div>
  );
}
