import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

export function CalendarQuickTile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { payments } = usePayments();

  const monthlyTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <button
      onClick={() => navigate("/calendar")}
      className="flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-border-soft bg-surface p-2.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <CalendarClock size={13} />
      </span>
      <div className="min-w-0 w-full">
        <p className="text-[10px] text-text-muted">{t("navCalendar")}</p>
        <p className="truncate font-mono text-xs font-bold tabular text-text-primary">
          {payments.length > 0 ? formatGEL(monthlyTotal) : t("noData")}
        </p>
      </div>
    </button>
  );
}
