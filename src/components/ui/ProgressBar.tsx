interface ProgressBarProps {
  percent: number;
  colorClass?: string;
  trackClassName?: string;
}

export function ProgressBar({ percent, colorClass = "gradient-accent", trackClassName = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-bg-elevated ${trackClassName}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
