export interface BarChartDatum {
  label: string;
  value: number;
  colorClass?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  formatValue?: (value: number) => string;
  defaultColorClass?: string;
}

export function BarChart({ data, formatValue = String, defaultColorClass = "bg-accent" }: BarChartProps) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <div>
      <div className="flex h-36 items-end gap-3">
        {data.map((d, i) => {
          const pct = Math.max((Math.abs(d.value) / maxAbs) * 100, d.value === 0 ? 0 : 4);
          const color = d.colorClass ?? (d.value < 0 ? "bg-danger" : defaultColorClass);
          return (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] font-mono tabular text-text-muted">{formatValue(d.value)}</span>
              <div className={`w-full rounded-t-md ${color}`} style={{ height: `${pct}%` }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3">
        {data.map((d, i) => (
          <span key={i} className="flex-1 truncate text-center text-[10px] text-text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
