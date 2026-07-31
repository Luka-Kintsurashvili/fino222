import type { ReactNode } from "react";

interface RingProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: ReactNode;
}

export function RingProgress({ percent, size = 96, strokeWidth = 9, color = "#6366F1", children }: RingProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border-soft)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
