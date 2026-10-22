import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, CircleAlert } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { NumberField } from "@/components/ui/NumberField";
import { Button } from "@/components/ui/Button";
import { BankLogo } from "@/components/ui/BankLogo";
import { RingProgress } from "@/components/ui/RingProgress";
import { compareLoanOffers, type LoanType } from "@/lib/loan";
import { scoreApplicant, type LoanCurrency, type Region, type EmploymentType, type CreditHistory } from "@/lib/creditRisk";
import { useTransactions } from "@/hooks/useTransactions";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";

type LoanMode = "compare" | "approval";

interface LoanSheetProps {
  open: boolean;
  onClose: () => void;
  initialMode?: LoanMode;
}

const REGIONS: { value: Region; labelKey: TranslationKey }[] = [
  { value: "Tbilisi", labelKey: "regionTbilisi" },
  { value: "Kutaisi", labelKey: "regionKutaisi" },
  { value: "Rustavi", labelKey: "regionRustavi" },
  { value: "Batumi", labelKey: "regionBatumi" },
  { value: "Other", labelKey: "regionOther" },
];

const EMPLOYMENT_TYPES: { value: EmploymentType; labelKey: TranslationKey }[] = [
  { value: "salaried", labelKey: "employmentSalaried" },
  { value: "public_sector", labelKey: "employmentPublicSector" },
  { value: "self_employed", labelKey: "employmentSelfEmployed" },
  { value: "freelancer", labelKey: "employmentFreelancer" },
];

const CREDIT_HISTORIES: { value: CreditHistory; labelKey: TranslationKey }[] = [
  { value: "none", labelKey: "creditHistoryNone" },
  { value: "some", labelKey: "creditHistorySome" },
  { value: "long", labelKey: "creditHistoryLong" },
];

function ChoiceGrid<T extends string>({ options, value, onChange }: { options: { value: T; labelKey: TranslationKey }[]; value: T; onChange: (v: T) => void }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-xl border px-2 py-2.5 text-center text-[11px] font-medium leading-tight transition-colors ${
            value === opt.value ? "border-accent/50 bg-accent-soft text-text-primary" : "border-border bg-surface text-text-secondary hover:border-accent/30"
          }`}
        >
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}

export function LoanSheet({ open, onClose, initialMode = "compare" }: LoanSheetProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { monthlyTotals } = useTransactions();

  const [mode, setMode] = useState<LoanMode>(initialMode);
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const [principal, setPrincipal] = useState(10000);
  const [months, setMonths] = useState(36);
  const [type, setType] = useState<LoanType>("consumer");

  const [amount, setAmount] = useState(5000);
  const [term, setTerm] = useState(24);
  const [currency, setCurrency] = useState<LoanCurrency>("GEL");
  const [region, setRegion] = useState<Region>("Tbilisi");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("salaried");
  const [creditHistory, setCreditHistory] = useState<CreditHistory>("some");
  const [existingLoans, setExistingLoans] = useState(0);
  const [yearsAtJob, setYearsAtJob] = useState(3);

  const typeOptions: { value: LoanType; label: string }[] = [
    { value: "consumer", label: t("loanTypeConsumer") },
    { value: "mortgage", label: t("loanTypeMortgage") },
    { value: "auto", label: t("loanTypeAuto") },
    { value: "business", label: t("loanTypeBusiness") },
    { value: "micro", label: t("loanTypeMicro") },
  ];

  const offers = useMemo(() => compareLoanOffers(principal, months, type), [principal, months, type]);

  const knownIncome = monthlyTotals[monthlyTotals.length - 1]?.income ?? 0;

  const result = useMemo(
    () =>
      knownIncome > 0
        ? scoreApplicant({
            age: 35,
            monthly_income_gel: knownIncome,
            loan_amount: amount,
            loan_term_months: term,
            loan_currency: currency,
            region,
            employment_type: employmentType,
            credit_history: creditHistory,
            years_at_job: yearsAtJob,
            credit_history_months: creditHistory === "long" ? 36 : creditHistory === "some" ? 12 : 0,
            income_months_last_6: 6,
            overdrafts_last_6m: 0,
            essentials_share_pct: 40,
            existing_loans: existingLoans,
          })
        : null,
    [knownIncome, amount, term, currency, region, employmentType, creditHistory, existingLoans, yearsAtJob]
  );

  const decisionColor =
    result?.decision === "auto_approve" ? "var(--color-success)" : result?.decision === "manual_review" ? "var(--color-warning)" : "var(--color-danger)";
  const decisionLabel =
    result?.decision === "auto_approve" ? t("decisionAutoApprove") : result?.decision === "manual_review" ? t("decisionManualReview") : t("decisionDecline");

  function handleAskFino() {
    if (!result) return;
    const reasonsText = result.reasons.map((r) => `${r.label} (${r.direction === "up" ? t("increasesRisk") : t("decreasesRisk")})`).join(", ");
    const message = `${t("creditCheckTitle")}: ${(result.pd * 100).toFixed(1)}% PD → ${decisionLabel}. ${t("ptiCheckLabel")} ${result.ptiPct.toFixed(1)}%/${result.ptiLimitPct}%. ${t("topFactorsLabel")}: ${reasonsText}.`;
    navigate("/", { state: { prefillInput: message } });
    onClose();
  }

  return (
    <FormSheet open={open} title={t("loanSheetTitle")} onClose={onClose}>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-bg-elevated p-1">
        {(["compare", "approval"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-2 py-2 text-[11px] font-semibold leading-tight transition-all ${
              mode === m ? "gradient-accent text-white shadow-md" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t(m === "compare" ? "loanModeCompare" : "loanModeApproval")}
          </button>
        ))}
      </div>

      {mode === "compare" ? (
        <>
          <NumberField label={t("loanPrincipalLabel")} value={principal} onChange={setPrincipal} suffix="₾" step={500} />
          <NumberField label={t("loanTermMonthsLabel")} value={months} onChange={setMonths} step={6} min={1} />

          <div>
            <span className="mb-2 block text-sm font-medium text-text-secondary">{t("loanTypeLabel")}</span>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    type === opt.value ? "gradient-accent text-white shadow-md" : "border border-border bg-surface text-text-secondary hover:border-accent/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {offers.length > 0 && (
            <div className="rounded-2xl border border-accent/30 bg-accent-soft p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <Trophy size={14} />
                {t("bestOfferBadge")}
              </div>
              <div className="mt-2.5 flex items-center gap-2.5">
                <BankLogo bank={offers[0].bank} size={32} />
                <p className="text-sm font-bold text-text-primary">{offers[0].bank.name}</p>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-text-muted">{t("monthlyPaymentLabel")}</p>
                  <p className="text-2xl font-bold tabular text-text-primary">{formatGEL(offers[0].monthlyPayment, { decimals: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-text-muted">{t("annualRateLabel")}</p>
                  <p className="text-lg font-bold tabular text-success">{(offers[0].annualRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {offers.map((offer, i) => (
              <div key={offer.bank.id} className={`rounded-2xl border p-3.5 ${i === 0 ? "border-accent/40 bg-accent-soft/40" : "border-border-soft bg-surface"}`}>
                <div className="flex items-center gap-2.5">
                  <BankLogo bank={offer.bank} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">{offer.bank.name}</p>
                    <p className="text-[11px] text-text-muted">
                      {(offer.annualRate * 100).toFixed(1)}% {t("annualRateLabel").toLowerCase()}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold tabular text-text-primary">{formatGEL(offer.monthlyPayment, { decimals: 2 })}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border-soft pt-2.5">
                  <div>
                    <p className="text-[10px] text-text-muted">{t("totalPaidLabel")}</p>
                    <p className="text-sm font-semibold tabular text-text-primary">{formatGEL(offer.totalPayment, { decimals: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted">{t("totalInterestLabel")}</p>
                    <p className="text-sm font-semibold tabular text-warning">{formatGEL(offer.totalInterest, { decimals: 2 })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-2.5 text-xs text-text-secondary">
            <CircleAlert size={14} className="mt-0.5 shrink-0 text-accent" />
            <p>{t("creditDisclaimer")}</p>
          </div>

          {knownIncome <= 0 ? (
            <div className="rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-xs text-warning">{t("needIncomeDataMessage")}</div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-border-soft bg-surface px-3.5 py-2.5 text-sm">
              <span className="text-text-secondary">{t("knownIncomeLabel")}</span>
              <span className="font-bold tabular text-text-primary">{formatGEL(knownIncome)}</span>
            </div>
          )}

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

          <div>
            <span className="mb-2 block text-sm font-medium text-text-secondary">{t("regionLabel")}</span>
            <ChoiceGrid options={REGIONS} value={region} onChange={setRegion} />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-text-secondary">{t("employmentTypeLabel")}</span>
            <ChoiceGrid options={EMPLOYMENT_TYPES} value={employmentType} onChange={setEmploymentType} />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-text-secondary">{t("creditHistoryLabel")}</span>
            <ChoiceGrid options={CREDIT_HISTORIES} value={creditHistory} onChange={setCreditHistory} />
          </div>
          <NumberField label={t("yearsAtJobLabel")} value={yearsAtJob} onChange={setYearsAtJob} step={1} min={0} />
          <NumberField label={t("existingLoansLabel")} value={existingLoans} onChange={setExistingLoans} step={1} min={0} />

          {result && (
            <>
              <div className="flex items-center gap-4 rounded-2xl border border-border-soft bg-surface p-4">
                <RingProgress percent={Math.min(result.pd * 100, 100)} size={64} strokeWidth={7} color={decisionColor}>
                  <span className="text-sm font-bold tabular text-text-primary">{(result.pd * 100).toFixed(1)}%</span>
                </RingProgress>
                <div>
                  <p className="text-[11px] text-text-muted">{t("defaultProbabilityLabel")}</p>
                  <p className="mt-0.5 text-base font-bold" style={{ color: decisionColor }}>
                    {decisionLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatGEL(result.monthlyPayment, { decimals: 0 })}/{t("perMonthSuffix")}
                  </p>
                </div>
              </div>

              <div className={`rounded-xl border p-3.5 ${result.ptiPass ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft"}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{t("ptiCheckLabel")}</span>
                  <span className={`font-bold ${result.ptiPass ? "text-success" : "text-danger"}`}>
                    {result.ptiPct.toFixed(1)}% / {result.ptiLimitPct}%
                  </span>
                </div>
                <p className={`mt-1 text-xs ${result.ptiPass ? "text-success" : "text-danger"}`}>{result.ptiPass ? t("ptiWithinLimit") : t("ptiExceedsLimit")}</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-text-primary">{t("topFactorsLabel")}</p>
                <div className="space-y-1.5">
                  {result.reasons.map((r) => (
                    <div key={r.label} className="flex items-center justify-between rounded-lg border border-border-soft bg-surface px-3 py-2 text-xs">
                      <span className="text-text-secondary">{r.label}</span>
                      <span className={r.direction === "up" ? "text-danger" : "text-success"}>{r.direction === "up" ? t("increasesRisk") : t("decreasesRisk")}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="secondary" className="w-full" onClick={handleAskFino}>
                {t("askFinoButton")}
              </Button>
            </>
          )}
        </>
      )}
    </FormSheet>
  );
}
