import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface CreditQuickTileProps {
  onClick: () => void;
}

export function CreditQuickTile({ onClick }: CreditQuickTileProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1.5 rounded-xl border border-border-soft bg-surface p-2.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <ShieldCheck size={13} />
      </span>
      <div>
        <p className="text-[10px] text-text-muted">{t("navCredit")}</p>
        <p className="truncate font-mono text-xs font-bold tabular text-text-primary">AUC 0.78</p>
      </div>
    </button>
  );
}
