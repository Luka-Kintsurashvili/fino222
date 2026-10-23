import { Landmark } from "lucide-react";
import { banks } from "@/data/banks";
import { useLanguage } from "@/lib/LanguageContext";

interface LoanQuickTileProps {
  onClick: () => void;
}

export function LoanQuickTile({ onClick }: LoanQuickTileProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      className="flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-border-soft bg-surface p-2.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Landmark size={13} />
      </span>
      <div className="min-w-0 w-full">
        <p className="text-[10px] text-text-muted">{t("navLoan")}</p>
        <p className="truncate font-mono text-xs font-bold tabular text-text-primary">{t("banksCompared").replace("{count}", String(banks.length))}</p>
      </div>
    </button>
  );
}
