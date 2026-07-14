import { useMemo, useState } from "react";
import { ShieldCheck, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NumberField } from "@/components/ui/NumberField";
import { formatGEL } from "@/lib/format";
import { estimateEligibility } from "@/lib/loanTools";
import { useChatUI } from "@/lib/ChatUIContext";

export function LoanEligibilityTab() {
  const [income, setIncome] = useState(2000);
  const [existingObligations, setExistingObligations] = useState(300);
  const [desiredAmount, setDesiredAmount] = useState(10000);
  const { openChat } = useChatUI();

  const result = useMemo(
    () => estimateEligibility(income, existingObligations, desiredAmount),
    [income, existingObligations, desiredAmount]
  );

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="font-semibold text-text-primary">სესხის უფლების შემოწმება</p>
            <p className="text-xs text-text-secondary">შეავსე ძირითადი ინფორმაცია და ფინო დაგეხმარება შეფასებაში</p>
          </div>
        </div>
        <NumberField label="ყოველთვიური შემოსავალი" value={income} onChange={setIncome} suffix="₾" step={100} />
        <NumberField
          label="არსებული ყოველთვიური ვალდებულებები"
          value={existingObligations}
          onChange={setExistingObligations}
          suffix="₾"
          step={50}
        />
        <NumberField
          label="სასურველი სესხის ოდენობა"
          value={desiredAmount}
          onChange={setDesiredAmount}
          suffix="₾"
          step={500}
        />
      </Card>

      <Card
        className={`flex flex-col items-center gap-2 text-center ${
          result.isRealistic ? "border-success/30 bg-success-soft" : "border-warning/30 bg-warning-soft"
        }`}
      >
        <p className="text-xs text-text-muted">სავარაუდო მაქსიმალური სესხი</p>
        <p className="font-mono text-2xl font-bold tabular text-text-primary">
          {formatGEL(result.maxEligibleAmount, { decimals: 0 })}
        </p>
        <p className={`text-sm font-medium ${result.isRealistic ? "text-success" : "text-warning"}`}>
          {result.isRealistic
            ? "სასურველი თანხა შენს შესაძლებლობებში ჯდება"
            : `დაახლოებით ${formatGEL(result.gap, { decimals: 0 })}-ით მეტს ითხოვ, ვიდრე შესაძლებელია`}
        </p>
        <p className="text-xs text-text-muted">
          გათვლილია 36-თვიან ვადაზე, ~15% წლიური განაკვეთით, არსებული ვალდებულებების გათვალისწინებით — საორიენტაციო
          შეფასებაა, არა საბანკო გადაწყვეტილება.
        </p>
      </Card>

      <Button variant="secondary" className="w-full" onClick={openChat}>
        <MessageCircle size={16} />
        ფინოსთან საუბარი
      </Button>
    </div>
  );
}
