'use client';

interface PieChartSegment {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  segments: PieChartSegment[];
  size?: number;
  showLegend?: boolean;
}

export function PieChart({ segments, size = 200, showLegend = true }: PieChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          className="rounded-full bg-muted flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-muted-foreground text-sm">Sin datos</span>
        </div>
      </div>
    );
  }

  // Calculate pie segments
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;

  let currentAngle = -90; // Start from top

  const paths = segments.map((segment, index) => {
    const percentage = segment.value / total;
    const angle = percentage * 360;

    // Calculate arc
    const startAngle = (currentAngle * Math.PI) / 180;
    const endAngle = ((currentAngle + angle) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData =
      percentage === 1
        ? // Full circle
          `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX - 0.001} ${centerY - radius} Z`
        : `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    currentAngle += angle;

    return (
      <path
        key={index}
        d={pathData}
        fill={segment.color}
        className="transition-opacity hover:opacity-80"
      />
    );
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths}
      </svg>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-sm text-muted-foreground">
                {segment.label}: {segment.value} (
                {total > 0 ? Math.round((segment.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
