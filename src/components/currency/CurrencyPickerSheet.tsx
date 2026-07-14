import { Check } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { currencies, type CurrencyCode } from "@/lib/currency";

interface CurrencyPickerSheetProps {
  open: boolean;
  selected: CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
  onClose: () => void;
}

export function CurrencyPickerSheet({ open, selected, onSelect, onClose }: CurrencyPickerSheetProps) {
  return (
    <FormSheet open={open} title="აირჩიე ვალუტა" onClose={onClose}>
      <div className="space-y-1.5">
        {currencies.map((c) => {
          const active = c.code === selected;
          return (
            <button
              key={c.code}
              onClick={() => {
                onSelect(c.code);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-colors ${
                active ? "bg-accent-soft" : "hover:bg-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl leading-none">{c.flag}</span>
                <div>
                  <p className="font-mono text-sm font-semibold tabular text-text-primary">{c.code}</p>
                  <p className="text-xs text-text-muted">{c.label}</p>
                </div>
              </div>
              {active && <Check size={18} className="text-accent" />}
            </button>
          );
        })}
      </div>
    </FormSheet>
  );
}
