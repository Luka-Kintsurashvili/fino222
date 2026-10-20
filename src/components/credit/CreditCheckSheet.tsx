import { useMemo, useState } from "react";
import { CircleAlert } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { NumberField } from "@/components/ui/NumberField";
import { RingProgress } from "@/components/ui/RingProgress";
import { scoreApplicant, type LoanCurrency } from "@/lib/creditRisk";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

interface CreditCheckSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CreditCheckSheet({ open, onClose }: CreditCheckSheetProps) {
  const { t } = useLanguage();
  const [income, setIncome] = useState(2000);
  const [amount, setAmount] = useState(5000);
  const [term, setTerm] = useState(24);
  const [currency, setCurrency] = useState<LoanCurrency>("GEL");

  const result = useMemo(
    () =>
      scoreApplicant({
        age: 35,
        monthly_income_gel: income,
        loan_amount: amount,
        loan_term_months: term,
        loan_currency: currency,
        region: "Tbilisi",
        employment_type: "salaried",
        credit_history: "some",
        years_at_job: 3,
        credit_history_months: 24,
        income_months_last_6: 6,
        overdrafts_last_6m: 0,
        essentials_share_pct: 40,
        existing_loans: 0,
      }),
    [income, amount, term, currency]
  );

  const decisionColor = result.decision === "auto_approve" ? "var(--color-success)" : result.decision === "manual_review" ? "var(--color-warning)" : "var(--color-danger)";
  const decisionLabel =
    result.decision === "auto_approve" ? t("decisionAutoApprove") : result.decision === "manual_review" ? t("decisionManualReview") : t("decisionDecline");

  return (
    <FormSheet open={open} title={t("creditCheckTitle")} onClose={onClose}>
      <div className="flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-2.5 text-xs text-text-secondary">
        <CircleAlert size={14} className="mt-0.5 shrink-0 text-accent" />
        <p>{t("creditDisclaimer")}</p>
      </div>

      <NumberField label={t("monthlyIncomeLabel")} value={income} onChange={setIncome} suffix="₾" step={100} />
      <NumberField label={t("loanPrincipalLabel")} value={amount} onChange={setAmount} suffix="₾" step={500} />
      <NumberField label={t("loanTermMonthsLabel")} value={term} onChange={setTerm} step={6} min={1} />

      <div className="flex gap-2">
        {(["GEL", "USD"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors ${
              currency === c ? "border-accent/50 bg-accent-soft text-text-primary" : "border-border bg-surface text-text-secondary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border-soft bg-surface p-4">
        <RingProgress percent={Math.min(result.pd * 100, 100)} size={64} strokeWidth={7} color={decisionColor}>
          <span className="text-sm font-bold tabular text-text-primary">{(result.pd * 100).toFixed(1)}%</span>
        </RingProgress>
        <div>
          <p className="text-[11px] text-text-muted">{t("defaultProbabilityLabel")}</p>
          <p className="mt-0.5 text-base font-bold" style={{ color: decisionColor }}>
            {decisionLabel}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{formatGEL(result.monthlyPayment, { decimals: 0 })}/{t("perMonthSuffix")}</p>
        </div>
      </div>

      <div className={`rounded-xl border p-3.5 ${result.ptiPass ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft"}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{t("ptiCheckLabel")}</span>
          <span className={`font-bold ${result.ptiPass ? "text-success" : "text-danger"}`}>
            {result.ptiPct.toFixed(1)}% / {result.ptiLimitPct}%
          </span>
        </div>
        <p className={`mt-1 text-xs ${result.ptiPass ? "text-success" : "text-danger"}`}>
          {result.ptiPass ? t("ptiWithinLimit") : t("ptiExceedsLimit")}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-text-primary">{t("topFactorsLabel")}</p>
        <div className="space-y-1.5">
          {result.reasons.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-lg border border-border-soft bg-surface px-3 py-2 text-xs">
              <span className="text-text-secondary">{r.label}</span>
              <span className={r.direction === "up" ? "text-danger" : "text-success"}>
                {r.direction === "up" ? t("increasesRisk") : t("decreasesRisk")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </FormSheet>
  );
}
