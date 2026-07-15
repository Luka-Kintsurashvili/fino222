import { useNavigate } from "react-router-dom";
import { ChartColumnBig, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export function GraphsTile() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => navigate("/graphs")}
      className="flex w-full items-center gap-3 rounded-2xl border border-border-soft bg-surface p-4 text-left transition-colors hover:border-accent/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-accent text-white">
        <ChartColumnBig size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{t("navGraphs")}</p>
        <p className="text-xs text-text-muted">{t("graphsTileSubtitle")}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-text-muted" />
    </button>
  );
}
