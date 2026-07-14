import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { NumberField } from "@/components/ui/NumberField";
import { BankLogo } from "@/components/ui/BankLogo";
import { LoanTypeGrid } from "@/components/loan/LoanTypeGrid";
import { formatGEL, formatPercent } from "@/lib/format";
import { compareLoanOffers, type LoanType } from "@/lib/loan";

export function LoanComparisonTab() {
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(36);
  const [type, setType] = useState<LoanType>("consumer");

  const offers = useMemo(() => compareLoanOffers(amount, months, type), [amount, months, type]);
  const cheapest = offers[0];

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <NumberField label="სესხის თანხა" value={amount} onChange={setAmount} suffix="₾" step={500} />
        <NumberField label="ვადა (თვეები)" value={months} onChange={setMonths} suffix="თვე" min={1} max={360} />
        <div>
          <span className="mb-2 block text-sm font-medium text-text-secondary">სესხის ტიპი</span>
          <LoanTypeGrid value={type} onChange={setType} />
        </div>
      </Card>

      {cheapest && amount > 0 && months > 0 && (
        <Card className="relative overflow-hidden border-accent/30">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-to/20 blur-[60px]" />
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Trophy size={14} />
            ყველაზე ხელსაყრელი შეთავაზება
          </div>
          <div className="flex items-center gap-2">
            <BankLogo bank={cheapest.bank} size={24} />
            <p className="text-lg font-bold text-text-primary">{cheapest.bank.name}</p>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-text-muted">ყოველთვიური გადასახადი</p>
              <p className="font-mono text-2xl font-bold tabular text-text-primary">
                {formatGEL(cheapest.monthlyPayment, { decimals: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">წლიური განაკვეთი</p>
              <p className="font-mono text-lg font-semibold tabular text-success">
                {formatPercent(cheapest.annualRate * 100)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {offers.map((offer, i) => (
          <Card key={offer.bank.id} className={i === 0 ? "border-accent/20" : ""}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BankLogo bank={offer.bank} size={36} />
                <div>
                  <p className="font-semibold text-text-primary">{offer.bank.name}</p>
                  <p className="text-xs text-text-muted">{formatPercent(offer.annualRate * 100)} წლიური</p>
                </div>
              </div>
              <p className="font-mono text-lg font-bold tabular text-text-primary">
                {formatGEL(offer.monthlyPayment, { decimals: 2 })}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border-soft pt-3 text-sm">
              <div>
                <p className="text-xs text-text-muted">სულ გადასახდელი</p>
                <p className="font-mono tabular text-text-secondary">{formatGEL(offer.totalPayment)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">გადასახდელი პროცენტი</p>
                <p className="font-mono tabular text-warning">{formatGEL(offer.totalInterest)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
