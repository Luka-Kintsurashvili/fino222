import { useMemo, useState } from "react";
import { TrendingDown, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { NumberField } from "@/components/ui/NumberField";
import { formatGEL, monthsToYearsLabel } from "@/lib/format";
import { calculateEarlyPayoff } from "@/lib/loanTools";

export function LoanPayoffTab() {
  const [balance, setBalance] = useState(15000);
  const [rate, setRate] = useState(18);
  const [currentPayment, setCurrentPayment] = useState(450);
  const [extraPayment, setExtraPayment] = useState(0);

  const result = useMemo(
    () => calculateEarlyPayoff(balance, rate / 100, currentPayment, extraPayment),
    [balance, rate, currentPayment, extraPayment]
  );

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <NumberField label="დარჩენილი ნაშთი" value={balance} onChange={setBalance} suffix="₾" step={500} />
        <NumberField label="წლიური განაკვეთი" value={rate} onChange={setRate} suffix="%" step={0.5} />
        <NumberField
          label="მიმდინარე ყოველთვიური გადასახადი"
          value={currentPayment}
          onChange={setCurrentPayment}
          suffix="₾"
          step={10}
        />
        <NumberField
          label="დამატებითი გადასახადი თვეში"
          value={extraPayment}
          onChange={setExtraPayment}
          suffix="₾"
          step={10}
        />
      </Card>

      {!result && (
        <Card className="flex items-start gap-3 border-danger/30 bg-danger-soft">
          <TriangleAlert className="mt-0.5 shrink-0 text-danger" size={20} />
          <p className="text-sm text-danger">
            მითითებული გადასახადი არ ფარავს დარიცხულ პროცენტსაც კი — სესხი ამ პირობებით არასდროს დაიფარება. გაზარდე
            ყოველთვიური გადასახადი.
          </p>
        </Card>
      )}

      {result && (
        <>
          <Card className="relative overflow-hidden border-success/30">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-[60px]" />
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <TrendingDown size={14} />
              დამატებითი გადასახადის ეფექტი
            </div>
            <p className="font-mono text-3xl font-bold tabular text-text-primary">
              {extraPayment > 0 ? monthsToYearsLabel(result.monthsSaved) : "0 თვე"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">უფრო ადრე დაფარავ სესხს</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-soft pt-4">
              <div>
                <p className="text-xs text-text-muted">დაზოგილი პროცენტი</p>
                <p className="font-mono text-lg font-semibold tabular text-success">
                  {formatGEL(result.interestSaved, { decimals: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">ახალი ვადა</p>
                <p className="font-mono text-lg font-semibold tabular text-text-primary">
                  {monthsToYearsLabel(result.fasterMonths)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-text-primary">შედარება</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mb-1 text-xs text-text-muted">მიმდინარე გეგმა</p>
                <p className="font-mono tabular text-text-primary">{monthsToYearsLabel(result.baseMonths)}</p>
                <p className="font-mono text-xs tabular text-warning">{formatGEL(result.baseInterest)} პროცენტი</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">დამატებითი გადასახადით</p>
                <p className="font-mono tabular text-text-primary">{monthsToYearsLabel(result.fasterMonths)}</p>
                <p className="font-mono text-xs tabular text-success">{formatGEL(result.fasterInterest)} პროცენტი</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
