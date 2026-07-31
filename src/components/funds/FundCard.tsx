import { useState } from "react";
import { Plus, Trash2, CloudRain } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RingProgress } from "@/components/ui/RingProgress";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";
import type { Fund } from "@/types/fund";

interface FundCardProps {
  fund: Fund;
  onAddMoney: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}

export function FundCard({ fund, onAddMoney, onDelete }: FundCardProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const pct = fund.target_amount > 0 ? (fund.saved_amount / fund.target_amount) * 100 : 0;
  const color = fund.is_rainy_day ? "#F59E0B" : "#6366F1";

  function handleAdd() {
    const value = Number(amount);
    if (!value || value <= 0) return;
    onAddMoney(fund.id, value);
    setAmount("");
  }

  return (
    <Card className="flex flex-col items-center gap-3 !p-4 text-center">
      <div className="flex w-full items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          {fund.is_rainy_day && <CloudRain size={13} className="shrink-0 text-warning" />}
          <p className="truncate text-sm font-semibold text-text-primary">{fund.name}</p>
        </span>
        <button
          onClick={() => onDelete(fund.id)}
          className="shrink-0 rounded-lg p-1 text-text-muted hover:bg-danger-soft hover:text-danger"
          aria-label={t("delete")}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <RingProgress percent={pct} size={84} strokeWidth={8} color={color}>
        <p className="text-base font-bold tabular text-text-primary">{pct.toFixed(0)}%</p>
      </RingProgress>

      <div>
        <p className="font-mono text-xs tabular text-text-secondary">
          {formatGEL(fund.saved_amount)} / {formatGEL(fund.target_amount)}
        </p>
        <p className="mt-0.5 text-[10px] text-text-muted">
          {fund.contribution_mode === "fixed"
            ? t("monthlyFixed").replace("{amount}", formatGEL(fund.contribution_value))
            : t("monthlyPercent").replace("{percent}", String(fund.contribution_value))}
        </p>
      </div>

      <div className="flex w-full items-center gap-1.5">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          type="number"
          inputMode="decimal"
          placeholder="₾"
          className="w-full min-w-0 rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-center text-xs text-text-primary outline-none [appearance:textfield] focus:border-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          onClick={handleAdd}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg gradient-accent text-white"
          aria-label={t("addMoney")}
        >
          <Plus size={14} />
        </button>
      </div>
    </Card>
  );
}
