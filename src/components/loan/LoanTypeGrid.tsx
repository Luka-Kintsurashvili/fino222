import type { LucideIcon } from "lucide-react";
import { Wallet, Home, Car, Briefcase, Coins } from "lucide-react";
import type { LoanType } from "@/lib/loan";

const loanTypeOptions: { value: LoanType; label: string; icon: LucideIcon }[] = [
  { value: "consumer", label: "სამომხმარებლო", icon: Wallet },
  { value: "mortgage", label: "იპოთეკა", icon: Home },
  { value: "auto", label: "საავტომობილო", icon: Car },
  { value: "business", label: "ბიზნესი", icon: Briefcase },
  { value: "micro", label: "მიკრო", icon: Coins },
];

interface LoanTypeGridProps {
  value: LoanType;
  onChange: (value: LoanType) => void;
}

export function LoanTypeGrid({ value, onChange }: LoanTypeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {loanTypeOptions.map(({ value: optValue, label, icon: Icon }) => {
        const active = optValue === value;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
              active ? "border-accent/50 bg-accent-soft" : "border-border bg-surface hover:border-accent/30"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                active ? "gradient-accent text-white" : "bg-bg-elevated text-text-secondary"
              }`}
            >
              <Icon size={17} />
            </span>
            <span className={`text-sm font-medium ${active ? "text-text-primary" : "text-text-secondary"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
