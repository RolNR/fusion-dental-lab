'use client';

interface BarItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

interface HorizontalBarChartProps {
  items: BarItem[];
  maxValue?: number;
  showPercentage?: boolean;
  secondaryLabel?: string;
}

export function HorizontalBarChart({
  items,
  maxValue,
  showPercentage = false,
  secondaryLabel,
}: HorizontalBarChartProps) {
  const max = maxValue || Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground text-sm">Sin datos</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const percentage = Math.round((item.value / max) * 100);
        return (
          <div key={index}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-foreground truncate max-w-[60%]">{item.label}</span>
              <span className="text-muted-foreground">
                {item.value}
                {showPercentage && item.secondaryValue !== undefined && (
                  <span className="ml-2 text-primary">
                    ({item.secondaryValue}% {secondaryLabel || ''})
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color || 'hsl(var(--primary))',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
