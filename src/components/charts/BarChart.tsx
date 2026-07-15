export interface BarChartDatum {
  label: string;
  value: number;
  colorFrom?: string;
  colorTo?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  formatValue?: (value: number) => string;
}

const WIDTH = 320;
const HEIGHT = 170;
const PADDING_TOP = 22;
const BASELINE_Y = HEIGHT - 20;
const PLOT_HEIGHT = BASELINE_Y - PADDING_TOP;

export function BarChart({ data, formatValue = String }: BarChartProps) {
  if (data.length === 0) return null;

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const gap = 14;
  const barWidth = (WIDTH - gap * (data.length - 1)) / data.length;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={PADDING_TOP + PLOT_HEIGHT * (1 - f)}
            y2={PADDING_TOP + PLOT_HEIGHT * (1 - f)}
            stroke="var(--color-border-soft)"
            strokeWidth={1}
          />
        ))}

        {data.map((d, i) => {
          const x = i * (barWidth + gap);
          const barHeight = Math.max((Math.abs(d.value) / maxAbs) * PLOT_HEIGHT, d.value === 0 ? 0 : 6);
          const y = BASELINE_Y - barHeight;
          const gradId = `bar-grad-${i}`;
          const isNegative = d.value < 0;
          const from = d.colorFrom ?? (isNegative ? "#F43F5E" : "#3B82F6");
          const to = d.colorTo ?? (isNegative ? "#FB7185" : "#8B5CF6");

          return (
            <g key={i}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={to} />
                  <stop offset="100%" stopColor={from} />
                </linearGradient>
              </defs>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill={`url(#${gradId})`} />
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize={10}
                fontFamily="var(--font-mono)"
                fill="var(--color-text-muted)"
              >
                {formatValue(d.value)}
              </text>
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-text-muted)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
