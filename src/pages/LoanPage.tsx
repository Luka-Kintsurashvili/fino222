import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LoanComparisonTab } from "@/components/loan/LoanComparisonTab";
import { LoanPayoffTab } from "@/components/loan/LoanPayoffTab";
import { LoanEligibilityTab } from "@/components/loan/LoanEligibilityTab";
import { useLanguage } from "@/lib/LanguageContext";

type LoanView = "comparison" | "payoff" | "eligibility";

export function LoanPage() {
  const [view, setView] = useState<LoanView>("comparison");
  const { t } = useLanguage();

  const viewOptions: { value: LoanView; label: string }[] = [
    { value: "comparison", label: t("loanComparisonTab") },
    { value: "payoff", label: t("loanPayoffTab") },
    { value: "eligibility", label: t("loanEligibilityTab") },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t("loanTitle")} subtitle={t("loanSubtitle")} />

      <SegmentedControl options={viewOptions} value={view} onChange={setView} />

      {view === "comparison" && <LoanComparisonTab />}
      {view === "payoff" && <LoanPayoffTab />}
      {view === "eligibility" && <LoanEligibilityTab />}
    </div>
  );
}
