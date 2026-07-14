interface FinoMarkProps {
  size?: number;
  className?: string;
}

/** Original mark: an ascending bar-chart glyph on the brand gradient — reads clearly at any size. */
export function FinoMark({ size = 32, className = "" }: FinoMarkProps) {
  return (
    <span
      className={`gradient-accent flex shrink-0 items-center justify-center rounded-2xl shadow-[0_4px_16px_rgba(99,102,241,0.4)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="13" width="4" height="7" rx="1.5" fill="white" />
        <rect x="10" y="9" width="4" height="11" rx="1.5" fill="white" />
        <rect x="16" y="4" width="4" height="16" rx="1.5" fill="white" fillOpacity="0.85" />
      </svg>
    </span>
  );
}
