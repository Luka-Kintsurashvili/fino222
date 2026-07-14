import { useEffect, useState } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({ label, value, onChange, suffix, min = 0, max, step = 1 }: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  // Sync from outside (e.g. a preset button resets the value) without clobbering in-progress typing.
  useEffect(() => {
    // Only react to external value changes; reacting to our own `text` would clobber
    // in-progress typing (e.g. an empty field or a trailing "-" while the user types).
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
    if (text === "" || Number.isNaN(Number(text))) {
      setText(String(value));
    }
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-secondary">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-3 focus-within:border-accent transition-colors">
        <input
          type="number"
          inputMode="decimal"
          className="w-full bg-transparent font-mono text-lg tabular text-text-primary outline-none placeholder:text-text-muted [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={text}
          min={min}
          max={max}
          step={step}
          onFocus={(e) => e.target.select()}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
        {suffix && <span className="shrink-0 font-mono text-sm text-text-muted">{suffix}</span>}
      </div>
    </label>
  );
}
