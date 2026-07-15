export interface DonutChartDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  formatValue?: (value: number) => string;
  centerLabel?: string;
}

const SIZE = 150;
const STROKE = 20;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ data, formatValue = String, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-text-muted">მონაცემები არ არის</p>;
  }

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-border-soft)" strokeWidth={STROKE} />
          {data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * CIRCUMFERENCE;
            const circle = (
              <circle
                key={i}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={d.color}
                strokeWidth={STROKE}
                strokeDasharray={`${Math.max(dash - 2, 0)} ${CIRCUMFERENCE - dash + 2}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] text-text-muted">{centerLabel ?? "სულ"}</p>
          <p className="font-mono text-sm font-bold tabular text-text-primary">{formatValue(total)}</p>
        </div>
      </div>

      <div className="w-full space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="flex-1 truncate text-text-secondary">{d.label}</span>
            <span className="shrink-0 font-mono tabular text-text-primary">{formatValue(d.value)}</span>
            <span className="w-10 shrink-0 text-right text-xs text-text-muted">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
