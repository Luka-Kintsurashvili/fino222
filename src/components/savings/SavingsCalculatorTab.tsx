import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { NumberField } from "@/components/ui/NumberField";
import { SliderField } from "@/components/ui/SliderField";
import { formatGEL, formatPercent, monthsToYearsLabel, georgianMonth } from "@/lib/format";
import { monthsToGoal } from "@/lib/savings";
import { banks } from "@/data/banks";
import { BankLogo } from "@/components/ui/BankLogo";

export function SavingsCalculatorTab() {
  const [target, setTarget] = useState(20000);
  const [contribution, setContribution] = useState(400);
  const [rate, setRate] = useState(9);

  const result = useMemo(() => monthsToGoal(target, contribution, rate / 100), [target, contribution, rate]);

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <NumberField label="სამიზნე თანხა" value={target} onChange={setTarget} suffix="₾" step={500} />
        <NumberField label="ყოველთვიური შენატანი" value={contribution} onChange={setContribution} suffix="₾" step={50} />
        <SliderField
          label="წლიური საპროცენტო განაკვეთი"
          value={rate}
          onChange={setRate}
          min={0}
          max={15}
          step={0.1}
          formatValue={(v) => formatPercent(v)}
        />
      </Card>

      {result ? (
        <Card className="relative overflow-hidden border-accent/30">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-[60px]" />
          <p className="text-xs text-text-muted">მიზნამდე დარჩენილია</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular text-text-primary">
            {monthsToYearsLabel(result.months)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            პროგნოზირებული თარიღი: {georgianMonth(result.projectedDate.getMonth())} {result.projectedDate.getFullYear()}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-soft pt-4">
            <div>
              <p className="text-xs text-text-muted">სულ შენატანი</p>
              <p className="font-mono text-lg font-semibold tabular text-text-primary">
                {formatGEL(result.totalDeposited)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">დარიცხული პროცენტი</p>
              <p className="font-mono text-lg font-semibold tabular text-success">
                {formatGEL(result.interestEarned)}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-text-secondary">შეავსე თანხები, რომ ვნახოთ გამოთვლა.</p>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 font-semibold text-text-primary">დეპოზიტის განაკვეთები ბანკების მიხედვით</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] text-left text-sm">
            <thead>
              <tr className="text-xs text-text-muted">
                <th className="pb-2 font-medium">ბანკი</th>
                <th className="pb-2 font-medium">3 თვე</th>
                <th className="pb-2 font-medium">6 თვე</th>
                <th className="pb-2 font-medium">12 თვე</th>
              </tr>
            </thead>
            <tbody>
              {banks.map((bank) => (
                <tr key={bank.id} className="border-t border-border-soft">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <BankLogo bank={bank} size={22} />
                      <span className="font-medium text-text-primary">{bank.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 font-mono tabular text-text-secondary">
                    {formatPercent(bank.depositRates["3"] * 100)}
                  </td>
                  <td className="py-2.5 font-mono tabular text-text-secondary">
                    {formatPercent(bank.depositRates["6"] * 100)}
                  </td>
                  <td className="py-2.5 font-mono tabular text-success">
                    {formatPercent(bank.depositRates["12"] * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
