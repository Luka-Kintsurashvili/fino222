import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl border border-border-soft p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_10px_24px_-8px_rgba(0,0,0,0.35)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
