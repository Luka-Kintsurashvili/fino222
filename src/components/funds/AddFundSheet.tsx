import { useState } from "react";
import { CircleAlert, CloudRain } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { useTransactions } from "@/hooks/useTransactions";
import { useLanguage } from "@/lib/LanguageContext";
import { formatGEL } from "@/lib/format";
import type { ContributionMode, FundInput } from "@/types/fund";

interface AddFundSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (fund: FundInput) => Promise<string | null>;
}

export function AddFundSheet({ open, onClose, onAdd }: AddFundSheetProps) {
  const { t } = useLanguage();
  const { monthlyTotals } = useTransactions();
  const [name, setName] = useState("");
  const [target, setTarget] = useState(1000);
  const [mode, setMode] = useState<ContributionMode>("fixed");
  const [contribution, setContribution] = useState(100);
  const [isRainyDay, setIsRainyDay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const incomeMonths = monthlyTotals.filter((m) => m.income > 0);
  const avgMonthlyIncome =
    incomeMonths.length > 0 ? incomeMonths.reduce((sum, m) => sum + m.income, 0) / incomeMonths.length : 0;

  const modeOptions: { value: ContributionMode; label: string }[] = [
    { value: "fixed", label: t("fixedAmount") },
    { value: "percent", label: t("percentOfIncome") },
  ];

  function applyRainyDayPreset() {
    setName(t("rainyDayFundName"));
    setTarget(Math.round(avgMonthlyIncome * 6) || 3000);
    setIsRainyDay(true);
  }

  async function handleSubmit() {
    if (!name.trim() || target <= 0) return;
    setSubmitting(true);
    const err = await onAdd({
      name: name.trim(),
      target_amount: target,
      contribution_mode: mode,
      contribution_value: contribution,
      is_rainy_day: isRainyDay,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setName("");
    setTarget(1000);
    setMode("fixed");
    setContribution(100);
    setIsRainyDay(false);
    setError(null);
    onClose();
  }

  return (
    <FormSheet open={open} title={t("addFund")} onClose={onClose}>
      <button
        type="button"
        onClick={applyRainyDayPreset}
        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
          isRainyDay ? "border-warning/50 bg-warning-soft" : "border-border bg-surface hover:border-warning/30"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning">
          <CloudRain size={17} />
        </span>
        <span>
          <p className="text-sm font-medium text-text-primary">{t("rainyDayFundName")}</p>
          <p className="text-xs text-text-muted">
            {avgMonthlyIncome > 0
              ? t("rainyDaySuggestion").replace("{amount}", formatGEL(Math.round(avgMonthlyIncome * 6)))
              : t("rainyDayNoIncome")}
          </p>
        </span>
      </button>

      <TextField label={t("fundName")} value={name} onChange={setName} placeholder={t("fundNamePlaceholder")} />
      <NumberField label={t("targetAmount")} value={target} onChange={setTarget} suffix="₾" step={100} />

      <div>
        <span className="mb-2 block text-sm font-medium text-text-secondary">{t("monthlyContribution")}</span>
        <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
      </div>

      <NumberField
        label={mode === "fixed" ? t("amountPerMonth") : t("percentPerMonth")}
        value={contribution}
        onChange={setContribution}
        suffix={mode === "fixed" ? "₾" : "%"}
        step={mode === "fixed" ? 50 : 1}
        max={mode === "percent" ? 100 : undefined}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5">
          <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? t("saving") : t("save")}
      </Button>
    </FormSheet>
  );
}
