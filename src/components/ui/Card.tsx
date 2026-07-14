import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl border border-border-soft p-5 shadow-[0_8px_30px_rgb(0,0,0,0.25)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
