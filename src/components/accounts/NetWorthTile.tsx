import { Scale } from "lucide-react";
import { RingProgress } from "@/components/ui/RingProgress";
import { useAccounts } from "@/hooks/useAccounts";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";
import { useChartDrawer } from "@/lib/ChartDrawerContext";

export function NetWorthTile() {
  const { openDrawer } = useChartDrawer();
  const { t } = useLanguage();
  const { totalBalance } = useAccounts();
  const { liquidTotal, nonliquidTotal } = useAssets();
  const { total: liabilitiesTotal } = useLiabilities();

  const totalLiquid = totalBalance + liquidTotal;
  const totalAssets = totalLiquid + nonliquidTotal;
  const netWorth = totalAssets - liabilitiesTotal;
  const liquidPct = totalAssets > 0 ? (totalLiquid / totalAssets) * 100 : 0;

  return (
    <button
      onClick={() => openDrawer("networth")}
      className="flex flex-col items-start gap-2.5 rounded-2xl border border-border-soft bg-surface p-4 text-left transition-colors hover:border-accent/40"
    >
      <div className="flex w-full items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Scale size={16} />
        </span>
        <RingProgress percent={liquidPct} size={30} strokeWidth={4} color="#6366F1" />
      </div>
      <div>
        <p className="text-xs text-text-muted">{t("navNetWorth")}</p>
        <p className="mt-0.5 truncate font-mono text-base font-bold tabular text-text-primary">{formatGEL(netWorth)}</p>
      </div>
    </button>
  );
}
