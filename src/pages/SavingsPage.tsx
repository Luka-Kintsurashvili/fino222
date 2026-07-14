import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SavingsCalculatorTab } from "@/components/savings/SavingsCalculatorTab";
import { GoalsListTab } from "@/components/savings/GoalsListTab";
import { useLanguage } from "@/lib/LanguageContext";

type SavingsView = "plan" | "goals";

export function SavingsPage() {
  const [view, setView] = useState<SavingsView>("plan");
  const { t } = useLanguage();

  const viewOptions: { value: SavingsView; label: string }[] = [
    { value: "plan", label: t("savingsPlanTab") },
    { value: "goals", label: t("myGoalsTab") },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t("savingsGoalsTitle")} subtitle={t("savingsGoalsSubtitle")} />

      <SegmentedControl options={viewOptions} value={view} onChange={setView} />

      {view === "plan" && <SavingsCalculatorTab />}
      {view === "goals" && <GoalsListTab />}
    </div>
  );
}
