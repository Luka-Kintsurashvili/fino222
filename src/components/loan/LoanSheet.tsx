import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { NumberField } from "@/components/ui/NumberField";
import { BankLogo } from "@/components/ui/BankLogo";
import { compareLoanOffers, type LoanType } from "@/lib/loan";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

interface LoanSheetProps {
  open: boolean;
  onClose: () => void;
}

export function LoanSheet({ open, onClose }: LoanSheetProps) {
  const { t } = useLanguage();

  const [principal, setPrincipal] = useState(10000);
  const [months, setMonths] = useState(36);
  const [type, setType] = useState<LoanType>("consumer");

  const typeOptions: { value: LoanType; label: string }[] = [
    { value: "consumer", label: t("loanTypeConsumer") },
    { value: "mortgage", label: t("loanTypeMortgage") },
    { value: "auto", label: t("loanTypeAuto") },
    { value: "business", label: t("loanTypeBusiness") },
    { value: "micro", label: t("loanTypeMicro") },
  ];

  const offers = useMemo(() => compareLoanOffers(principal, months, type), [principal, months, type]);

  return (
    <FormSheet open={open} title={t("loanSheetTitle")} onClose={onClose}>
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
    </FormSheet>
  );
}
