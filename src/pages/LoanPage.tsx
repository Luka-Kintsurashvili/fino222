import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LoanComparisonTab } from "@/components/loan/LoanComparisonTab";
import { LoanPayoffTab } from "@/components/loan/LoanPayoffTab";
import { LoanEligibilityTab } from "@/components/loan/LoanEligibilityTab";

type LoanView = "comparison" | "payoff" | "eligibility";

const viewOptions: { value: LoanView; label: string }[] = [
  { value: "comparison", label: "სესხის შედარება" },
  { value: "payoff", label: "სესხის დაფარვა" },
  { value: "eligibility", label: "სესხის უფლება" },
];

export function LoanPage() {
  const [view, setView] = useState<LoanView>("comparison");

  return (
    <div className="space-y-5">
      <PageHeader title="სესხი" subtitle="შეადარე, დაგეგმე ვადაზე ადრე დაფარვა და შეამოწმე შენი შესაძლებლობები" />

      <SegmentedControl options={viewOptions} value={view} onChange={setView} />

      {view === "comparison" && <LoanComparisonTab />}
      {view === "payoff" && <LoanPayoffTab />}
      {view === "eligibility" && <LoanEligibilityTab />}
    </div>
  );
}
