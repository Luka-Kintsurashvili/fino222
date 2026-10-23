import { PieChart } from "lucide-react";
import { budgetRules } from "@/data/budgetRules";
import { useLanguage } from "@/lib/LanguageContext";

interface BudgetQuickTileProps {
  onClick: () => void;
}

export function BudgetQuickTile({ onClick }: BudgetQuickTileProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      className="flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-border-soft bg-surface p-2.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <PieChart size={13} />
      </span>
      <div className="min-w-0 w-full">
        <p className="text-[10px] text-text-muted">{t("navBudget")}</p>
        <p className="truncate font-mono text-xs font-bold tabular text-text-primary">
          {t("budgetRulesCount").replace("{count}", String(budgetRules.length))}
        </p>
      </div>
    </button>
  );
}
