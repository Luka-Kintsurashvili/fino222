import { useMemo, useState } from "react";
import { FormSheet } from "@/components/ui/FormSheet";
import { NumberField } from "@/components/ui/NumberField";
import { budgetRules } from "@/data/budgetRules";
import { budgetCategories, seedAmountsFromRule } from "@/data/budgetCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

interface BudgetSheetProps {
  open: boolean;
  onClose: () => void;
}

export function BudgetSheet({ open, onClose }: BudgetSheetProps) {
  const { t } = useLanguage();
  const { monthlyTotals } = useTransactions();
  const latestIncome = monthlyTotals[monthlyTotals.length - 1]?.income;

  const [income, setIncome] = useState(() => (latestIncome && latestIncome > 0 ? Math.round(latestIncome) : 3000));
  const [ruleId, setRuleId] = useState(budgetRules[0].id);

  const rule = budgetRules.find((r) => r.id === ruleId) ?? budgetRules[0];
  const amounts = useMemo(() => seedAmountsFromRule(rule, income), [rule, income]);
  const totalAllocated = Object.values(amounts).reduce((sum, v) => sum + v, 0);

  return (
    <FormSheet open={open} title={t("budgetSheetTitle")} onClose={onClose}>
      <NumberField label={t("monthlyIncomeLabel")} value={income} onChange={setIncome} suffix="₾" step={100} />

      <div>
        <span className="mb-2 block text-sm font-medium text-text-secondary">{t("budgetRuleLabel")}</span>
        <div className="grid grid-cols-2 gap-2.5">
          {budgetRules.map((r) => {
            const active = r.id === ruleId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRuleId(r.id)}
                className={`rounded-2xl border p-3.5 text-left transition-colors ${
                  active ? "border-accent/50 bg-accent-soft" : "border-border-soft bg-surface hover:border-accent/30"
                }`}
              >
                <p className="text-sm font-semibold text-text-primary">{r.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-text-muted">{r.description}</p>
                <p className="mt-2 font-mono text-xs tabular text-text-secondary">
                  {r.needs}/{r.wants}/{r.savings}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-text-muted">{t("monthlyIncomeLabel")}</p>
            <p className="text-lg font-bold tabular text-text-primary">{formatGEL(income)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-text-muted">{t("allocatedLabel")}</p>
            <p className="text-lg font-bold tabular text-text-primary">{formatGEL(totalAllocated)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {budgetCategories.map((cat) => {
          const amount = amounts[cat.key];
          const pct = income > 0 ? (amount / income) * 100 : 0;
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface p-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${cat.colorClass}`}>
                <Icon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">{cat.label}</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }} />
                </div>
              </div>
              <p className="shrink-0 text-sm font-bold tabular text-text-primary">{formatGEL(amount)}</p>
            </div>
          );
        })}
      </div>
    </FormSheet>
  );
}
