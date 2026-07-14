import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NumberField } from "@/components/ui/NumberField";
import { CategorySliderRow } from "@/components/ui/CategorySliderRow";
import { formatGEL, formatPercent } from "@/lib/format";
import { budgetRules } from "@/data/budgetRules";
import { budgetCategories, seedAmountsFromRule, type BudgetCategoryKey } from "@/data/budgetCategories";
import { useLanguage } from "@/lib/LanguageContext";

export function BudgetPage() {
  const { t } = useLanguage();
  const [income, setIncome] = useState(3000);
  const [ruleId, setRuleId] = useState(budgetRules[0].id);
  const [amounts, setAmounts] = useState<Record<BudgetCategoryKey, number>>(() =>
    seedAmountsFromRule(budgetRules[0], 3000)
  );

  function applyRule(ruleIdToApply: string) {
    const rule = budgetRules.find((r) => r.id === ruleIdToApply) ?? budgetRules[0];
    setRuleId(rule.id);
    setAmounts(seedAmountsFromRule(rule, income));
  }

  function updateCategory(key: BudgetCategoryKey, value: number) {
    setAmounts((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }

  const totalAllocated = Object.values(amounts).reduce((sum, v) => sum + v, 0);
  const allocatedPct = income > 0 ? (totalAllocated / income) * 100 : 0;
  const isOverBudget = totalAllocated > income;

  return (
    <div className="space-y-5">
      <PageHeader title={t("budgetTitle")} subtitle={t("budgetSubtitle")} />

      <Card className="space-y-4">
        <NumberField
          label="ყოველთვიური შემოსავალი"
          value={income}
          onChange={(v) => {
            setIncome(v);
            setAmounts(seedAmountsFromRule(budgetRules.find((r) => r.id === ruleId) ?? budgetRules[0], v));
          }}
          suffix="₾"
          step={100}
        />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {budgetRules.map((r) => {
          const active = r.id === ruleId;
          return (
            <button
              key={r.id}
              onClick={() => applyRule(r.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                active ? "border-accent/50 bg-accent-soft" : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <p className="text-sm font-semibold text-text-primary">{r.label}</p>
              <p className="mt-1 text-xs leading-snug text-text-muted">{r.description}</p>
              <p className="mt-2 font-mono text-xs tabular text-text-secondary">
                {r.needs}/{r.wants}/{r.savings}
              </p>
            </button>
          );
        })}
      </div>

      <Card className={isOverBudget ? "border-danger/30 bg-danger-soft" : "border-accent/20"}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">შემოსავალი</p>
            <p className="font-mono text-lg font-bold tabular text-text-primary">{formatGEL(income)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">გადანაწილებული</p>
            <p className={`font-mono text-lg font-bold tabular ${isOverBudget ? "text-danger" : "text-text-primary"}`}>
              {formatGEL(totalAllocated)}
              <span className="ml-1 text-sm font-medium">| {formatPercent(allocatedPct, 0)}</span>
            </p>
          </div>
        </div>
        {isOverBudget && (
          <p className="mt-2 text-xs text-danger">გადანაწილებული თანხა შემოსავალს აღემატება — შეამცირე რომელიმე კატეგორია</p>
        )}
      </Card>

      <Card className="space-y-5">
        {budgetCategories.map((cat) => (
          <CategorySliderRow
            key={cat.key}
            icon={cat.icon}
            label={cat.label}
            colorClass={cat.colorClass}
            value={amounts[cat.key]}
            onChange={(v) => updateCategory(cat.key, v)}
            max={Math.max(income, amounts[cat.key])}
            percent={income > 0 ? (amounts[cat.key] / income) * 100 : 0}
          />
        ))}
      </Card>
    </div>
  );
}
