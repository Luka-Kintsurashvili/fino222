interface FinoFaceProps {
  size?: number;
  expression?: "content" | "hype" | "roast";
  /** Background classes for the avatar circle. Defaults to the brand gradient. */
  bg?: string;
  className?: string;
}

/** Fino's chat avatar — an original friendly face, not an icon glyph. Expression follows chat mode. */
export function FinoFace({ size = 32, expression = "content", bg = "gradient-accent", className = "" }: FinoFaceProps) {
  return (
    <span
      className={`${bg} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[0_4px_16px_rgba(214,56,154,0.45)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        {expression === "hype" && (
          <>
            <circle cx="8" cy="10.5" r="2" fill="white" />
            <circle cx="16" cy="10.5" r="2" fill="white" />
            <path d="M7 15.5c1.2 1.6 3 2.4 5 2.4s3.8-.8 5-2.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
        {expression === "roast" && (
          <>
            <path d="M6 10.5h4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16" cy="10.5" r="1.8" fill="white" />
            <path d="M8 16c1.4 1 3.4 1.3 5 .4" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
        {expression === "content" && (
          <>
            <circle cx="8" cy="10.5" r="1.8" fill="white" />
            <circle cx="16" cy="10.5" r="1.8" fill="white" />
            <path d="M8 15.5c1.1 1.2 2.6 1.8 4 1.8s2.9-.6 4-1.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </>
        )}
      </svg>
    </span>
  );
}
