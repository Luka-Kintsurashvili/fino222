import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export function CalendarQuickTile() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => navigate("/calendar")}
      className="flex min-w-0 flex-col items-start gap-1.5 rounded-xl border border-border-soft bg-surface p-2.5 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <CalendarClock size={13} />
      </span>
      <div className="min-w-0 w-full">
        <p className="truncate text-[10px] text-text-muted">{t("navCalendar")}</p>
      </div>
    </button>
  );
}
