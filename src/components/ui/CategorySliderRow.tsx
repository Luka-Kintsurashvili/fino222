import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { formatGEL } from "@/lib/format";

interface CategorySliderRowProps {
  icon: LucideIcon;
  label: string;
  colorClass: string;
  value: number;
  onChange: (value: number) => void;
  max: number;
  percent: number;
}

export function CategorySliderRow({ icon: Icon, label, colorClass, value, onChange, max, percent }: CategorySliderRowProps) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(raw: string) {
    setText(raw);
    if (raw === "" || raw === "-") return;
    const num = Number(raw);
    if (!Number.isNaN(num)) onChange(num);
  }

  function handleBlur() {
    if (text === "" || Number.isNaN(Number(text))) setText(String(value));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}/15`}>
            <Icon size={16} className="text-text-primary" />
          </span>
          <span className="text-sm font-medium text-text-primary">{label}</span>
        </div>
        <span className="font-mono text-xs tabular text-text-muted">{percent.toFixed(0)}%</span>
      </div>

      <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3 py-2 focus-within:border-accent">
        <span className="font-mono text-sm text-text-muted">₾</span>
        <input
          type="number"
          inputMode="decimal"
          value={text}
          min={0}
          max={max}
          step={10}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-transparent text-right font-mono text-base tabular text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>

      <input
        type="range"
        min={0}
        max={max}
        step={10}
        value={Math.min(value, max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer rounded-full"
        style={{
          background: `linear-gradient(to right, var(--color-accent-from) 0%, var(--color-accent-to) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
        }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-text-muted">
        <span className="font-mono tabular">{formatGEL(0)}</span>
        <span className="font-mono tabular">{formatGEL(max)}</span>
      </div>
    </div>
  );
}
