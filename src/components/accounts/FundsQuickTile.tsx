import { useNavigate } from "react-router-dom";
import { CircleDollarSign } from "lucide-react";
import { useFunds } from "@/hooks/useFunds";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export function FundsQuickTile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { funds } = useFunds();

  const totalSaved = funds.reduce((sum, f) => sum + f.saved_amount, 0);

  return (
    <button
      onClick={() => navigate("/funds")}
      className="flex flex-col items-start gap-1.5 rounded-xl border border-border-soft bg-surface p-2.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <CircleDollarSign size={13} />
      </span>
      <div>
        <p className="text-[10px] text-text-muted">{t("navFunds")}</p>
        <p className="truncate font-mono text-xs font-bold tabular text-text-primary">
          {funds.length > 0 ? formatGEL(totalSaved) : t("noData")}
        </p>
      </div>
    </button>
  );
}
