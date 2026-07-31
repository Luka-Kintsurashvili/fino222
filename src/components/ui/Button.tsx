import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ children, variant = "primary", className = "", ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "gradient-accent text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_10px_-2px_rgba(99,102,241,0.4)] hover:shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_4px_16px_-2px_rgba(99,102,241,0.55)]",
    secondary: "border border-border bg-surface text-text-primary hover:border-accent/50",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-surface",
    danger: "border border-danger/30 bg-danger-soft text-danger hover:border-danger/50",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
