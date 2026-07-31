import { ChartColumnBig } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";
import { useChartDrawer } from "@/lib/ChartDrawerContext";

export function GraphsTile() {
  const { openDrawer } = useChartDrawer();
  const { t } = useLanguage();
  const { monthlyTotals } = useTransactions();

  const recent = monthlyTotals.slice(-4);
  const maxAbs = Math.max(...recent.map((m) => Math.abs(m.leftover)), 1);
  const latest = recent[recent.length - 1];

  return (
    <button
      onClick={() => openDrawer("graphs")}
      className="flex flex-col items-start gap-2.5 rounded-2xl border border-border-soft bg-surface p-4 text-left transition-colors hover:border-accent/40"
    >
      <div className="flex w-full items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <ChartColumnBig size={16} />
        </span>
        {recent.length > 0 && (
          <div className="flex h-6 items-end gap-0.5">
            {recent.map((m, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full ${m.leftover >= 0 ? "bg-success" : "bg-danger"}`}
                style={{ height: `${Math.max((Math.abs(m.leftover) / maxAbs) * 100, 15)}%` }}
              />
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-text-muted">{t("navGraphs")}</p>
        <p className="mt-0.5 truncate font-mono text-base font-bold tabular text-text-primary">
          {latest ? formatGEL(latest.leftover) : t("noData")}
        </p>
      </div>
    </button>
  );
}
