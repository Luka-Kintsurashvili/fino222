interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-border bg-bg-elevated p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-w-0 rounded-lg px-2 py-2 text-center text-xs font-medium leading-tight transition-all sm:text-sm ${
              active
                ? "gradient-accent text-white shadow-[0_2px_10px_rgba(99,102,241,0.4)]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
