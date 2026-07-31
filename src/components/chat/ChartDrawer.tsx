import { useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, CalendarClock, Plus, Scale, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import { FormSheet } from "@/components/ui/FormSheet";
import { RingProgress } from "@/components/ui/RingProgress";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { NumberField } from "@/components/ui/NumberField";
import { useChartDrawer } from "@/lib/ChartDrawerContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useReminders } from "@/hooks/useReminders";
import { useTransactions } from "@/hooks/useTransactions";
import { useAssets } from "@/hooks/useAssets";
import { useLiabilities } from "@/hooks/useLiabilities";
import { usePayments } from "@/hooks/usePayments";
import { assetTypes, type AssetTypeKey } from "@/data/assetTypes";
import { liabilityTypes, type LiabilityTypeKey } from "@/data/liabilityTypes";
import { budgetCategories } from "@/data/budgetCategories";
import { useLanguage } from "@/lib/LanguageContext";
import { formatGEL } from "@/lib/format";

function daysUntil(dueDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86_400_000);
}

interface ChartTooltipItem {
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipItem[];
}

/** Dark-theme-matching tooltip — recharts' default <Tooltip> renders a white/black box otherwise. */
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-bg-elevated px-3 py-2 shadow-lg">
      {label != null && <p className="mb-1 text-xs font-semibold text-text-primary">{label}</p>}
      {payload.map((item, i) => (
        <div key={item.dataKey ?? i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-text-secondary">{item.name}</span>
          <span className="ml-auto font-semibold tabular text-text-primary">{formatGEL(Number(item.value))}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartDrawer() {
  const { open, section, closeDrawer } = useChartDrawer();
  const { t } = useLanguage();

  const title = section === "graphs" ? t("navGraphs") : section === "networth" ? t("navNetWorth") : t("chartDrawerTitle");

  return (
    <FormSheet open={open} title={title} onClose={closeDrawer}>
      {section === "graphs" ? (
        <GraphsSection />
      ) : section === "networth" ? (
        <NetWorthSection />
      ) : (
        <OverviewSection onNavigate={closeDrawer} />
      )}
    </FormSheet>
  );
}

function OverviewSection({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useLanguage();
  const { totalBalance } = useAccounts();
  const { reminders } = useReminders();

  const upcoming = [...reminders].filter((r) => !r.acknowledged_at || daysUntil(r.due_date) >= 0).slice(0, 8);
  const chartData = upcoming.filter((r) => r.amount != null).map((r) => ({ label: r.label, amount: r.amount as number }));

  return (
    <>
      <div className="rounded-2xl gradient-accent p-4 text-white">
        <div className="flex items-center gap-2 text-white/80">
          <Wallet size={14} />
          <p className="text-xs font-medium">{t("totalBalance")}</p>
        </div>
        <p className="mt-1 text-2xl font-bold tabular">{formatGEL(totalBalance)}</p>
        <Link to="/wallet" onClick={onNavigate} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-white/90 hover:text-white">
          <Plus size={12} />
          {t("manageAccounts")}
        </Link>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-text-primary">
          <CalendarClock size={15} className="text-accent" />
          {t("upcomingReminders")}
        </h3>

        {upcoming.length === 0 ? (
          <p className="text-xs text-text-muted">{t("noRemindersYet")}</p>
        ) : (
          <>
            {chartData.length > 0 && (
              <div className="mb-3 h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface)" }} />
                    <Bar dataKey="amount" name={t("amount")} radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="var(--color-accent)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="space-y-2">
              {upcoming.map((r) => {
                const days = daysUntil(r.due_date);
                return (
                  <li key={r.id} className="flex items-center justify-between rounded-xl border border-border-soft bg-surface px-3.5 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{r.label}</p>
                      <p className="text-xs text-text-muted">
                        {days <= 0 ? t("dueToday") : t("dueInDays").replace("{days}", String(days))}
                      </p>
                    </div>
                    {r.amount != null && <p className="text-sm font-bold tabular text-text-primary">{formatGEL(r.amount)}</p>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function GraphsSection() {
  const { t } = useLanguage();
  const { monthlyTotals, expensesByCategory } = useTransactions();
  const { payments } = usePayments();

  const recentMonths = monthlyTotals.slice(-6);
  const latest = monthlyTotals[monthlyTotals.length - 1];
  const monthlyIncome = latest?.income ?? 0;
  const monthlyObligations = payments.reduce((sum, p) => sum + p.amount, 0);
  const dtiPercent = monthlyIncome > 0 ? (monthlyObligations / monthlyIncome) * 100 : 0;
  const savingsRate = monthlyIncome > 0 ? ((latest.income - latest.expenses) / monthlyIncome) * 100 : 0;

  const categoryData = [...expensesByCategory.entries()]
    .map(([key, amount]) => {
      const def = budgetCategories.find((c) => c.key === key);
      return { key, label: def?.label ?? key, color: def?.color ?? "var(--color-accent)", amount };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <>
      {monthlyIncome > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface p-3.5">
            <RingProgress percent={Math.min(dtiPercent, 100)} size={40} strokeWidth={5} color={dtiPercent > 40 ? "var(--color-danger)" : "var(--color-accent)"} />
            <div>
              <p className="text-[11px] leading-tight text-text-muted">{t("dtiLabel")}</p>
              <p className="text-lg font-bold tabular text-text-primary">{dtiPercent.toFixed(0)}%</p>
            </div>
          </div>
          <div className="rounded-xl border border-border-soft bg-surface p-3.5">
            <p className="text-[11px] text-text-muted">{t("savingsRateLabel")}</p>
            <p className={`mt-1 text-lg font-bold tabular ${savingsRate >= 0 ? "text-success" : "text-danger"}`}>
              {savingsRate.toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-bold text-text-primary">{t("incomeByMonth")}</h3>
        {recentMonths.length === 0 ? (
          <p className="text-xs text-text-muted">{t("noData")}</p>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentMonths} margin={{ left: 0, right: 0, top: 4, bottom: 0 }} barGap={2} barCategoryGap="30%">
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(m) => m.slice(2)}
                />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "var(--color-text-secondary)" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="income" name={t("totalIncome")} fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" name={t("totalExpenses")} fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="leftover" name={t("net")} fill="var(--color-accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-text-primary">{t("expensesByCategory")}</h3>
        {categoryData.length === 0 ? (
          <p className="text-xs text-text-muted">{t("noData")}</p>
        ) : (
          <div className="space-y-2">
            {categoryData.map((c) => (
              <div key={c.key} className="flex items-center justify-between rounded-xl border border-border-soft bg-surface px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-text-primary">{c.label}</span>
                </div>
                <span className="text-sm font-bold tabular text-text-primary">{formatGEL(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function NetWorthSection() {
  const { t } = useLanguage();
  const { totalBalance } = useAccounts();
  const { assets, addAsset, removeAsset, liquidTotal, nonliquidTotal } = useAssets();
  const { liabilities, addLiability, removeLiability, total: liabilitiesTotal } = useLiabilities();

  const [formOpen, setFormOpen] = useState<"asset" | "liability" | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [assetType, setAssetType] = useState<AssetTypeKey>(assetTypes[0].key);
  const [liabilityType, setLiabilityType] = useState<LiabilityTypeKey>(liabilityTypes[0].key);
  const [submitting, setSubmitting] = useState(false);

  const totalLiquid = totalBalance + liquidTotal;
  const totalAssets = totalLiquid + nonliquidTotal;
  const netWorth = totalAssets - liabilitiesTotal;
  const liquidPct = totalAssets > 0 ? (totalLiquid / totalAssets) * 100 : 0;

  function toggleForm(kind: "asset" | "liability") {
    setFormOpen((prev) => (prev === kind ? null : kind));
    setName("");
    setAmount(0);
  }

  async function handleSubmit() {
    if (!name.trim() || amount <= 0 || !formOpen) return;
    setSubmitting(true);
    if (formOpen === "asset") {
      const typeDef = assetTypes.find((a) => a.key === assetType)!;
      await addAsset({ name: name.trim(), type: assetType, liquidity: typeDef.liquidity, value: amount });
    } else {
      await addLiability({ name: name.trim(), type: liabilityType, amount });
    }
    setSubmitting(false);
    setFormOpen(null);
    setName("");
    setAmount(0);
  }

  return (
    <>
      <div className="rounded-2xl gradient-accent p-4 text-white">
        <div className="flex items-center gap-2 text-white/80">
          <Scale size={14} />
          <p className="text-xs font-medium">{t("navNetWorth")}</p>
        </div>
        <p className="mt-1 text-2xl font-bold tabular">{formatGEL(netWorth)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-border-soft bg-surface p-3.5">
          <p className="text-xs text-text-muted">{t("totalAssetsLabel")}</p>
          <p className="mt-1 text-lg font-bold tabular text-text-primary">{formatGEL(totalAssets)}</p>
        </div>
        <div className="rounded-xl border border-border-soft bg-surface p-3.5">
          <p className="text-xs text-text-muted">{t("totalLiabilitiesLabel")}</p>
          <p className="mt-1 text-lg font-bold tabular text-text-primary">{formatGEL(liabilitiesTotal)}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border-soft bg-surface p-3.5">
        <RingProgress percent={liquidPct} size={44} strokeWidth={5} color="#6366F1" />
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">{t("liquid")}</span>
            <span className="font-semibold tabular text-text-primary">{formatGEL(totalLiquid)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">{t("nonliquid")}</span>
            <span className="font-semibold tabular text-text-primary">{formatGEL(nonliquidTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => toggleForm("asset")}
          className={`flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-4 text-sm font-medium transition-colors ${
            formOpen === "asset" ? "border-accent bg-accent-soft text-accent" : "border-border-soft bg-surface text-text-secondary hover:border-accent/40"
          }`}
        >
          <Plus size={16} />
          {t("addAsset")}
        </button>
        <button
          type="button"
          onClick={() => toggleForm("liability")}
          className={`flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-4 text-center text-sm font-medium transition-colors ${
            formOpen === "liability" ? "border-accent bg-accent-soft text-accent" : "border-border-soft bg-surface text-text-secondary hover:border-accent/40"
          }`}
        >
          <Plus size={16} />
          {t("addLiability")}
        </button>
      </div>

      {formOpen && (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
          <div className="grid grid-cols-3 gap-2">
            {(formOpen === "asset" ? assetTypes : liabilityTypes).map((typeDef) => {
              const active = formOpen === "asset" ? assetType === typeDef.key : liabilityType === typeDef.key;
              const Icon = typeDef.icon;
              return (
                <button
                  key={typeDef.key}
                  type="button"
                  onClick={() =>
                    formOpen === "asset" ? setAssetType(typeDef.key as AssetTypeKey) : setLiabilityType(typeDef.key as LiabilityTypeKey)
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                    active ? "border-accent bg-accent-soft" : "border-border-soft bg-bg-elevated hover:border-accent/30"
                  }`}
                >
                  <Icon size={14} className={active ? "text-accent" : "text-text-secondary"} />
                  <span className="text-center text-[10px] font-medium leading-tight text-text-secondary">{typeDef.label}</span>
                </button>
              );
            })}
          </div>
          <TextField
            label={formOpen === "asset" ? t("assetName") : t("liabilityName")}
            value={name}
            onChange={setName}
            placeholder={formOpen === "asset" ? t("assetNamePlaceholder") : t("liabilityNamePlaceholder")}
          />
          <NumberField label={formOpen === "asset" ? t("balance") : t("amount")} value={amount} onChange={setAmount} suffix="₾" step={100} />
          <Button className="w-full" disabled={submitting || !name.trim() || amount <= 0} onClick={handleSubmit}>
            {formOpen === "asset" ? t("addAsset") : t("addLiability")}
          </Button>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-bold text-text-primary">{t("yourAssets")}</h3>
        {assets.length === 0 ? (
          <p className="text-xs text-text-muted">{t("noAssetsYet")}</p>
        ) : (
          <ul className="space-y-2">
            {assets.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl border border-border-soft bg-surface px-3.5 py-2.5">
                <span className="text-sm text-text-primary">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular text-text-primary">{formatGEL(a.value)}</span>
                  <button type="button" onClick={() => removeAsset(a.id)} className="text-text-muted hover:text-danger" aria-label={t("delete")}>
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-text-primary">{t("yourLiabilities")}</h3>
        {liabilities.length === 0 ? (
          <p className="text-xs text-text-muted">{t("noLiabilitiesYet")}</p>
        ) : (
          <ul className="space-y-2">
            {liabilities.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-xl border border-border-soft bg-surface px-3.5 py-2.5">
                <span className="text-sm text-text-primary">{l.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular text-text-primary">{formatGEL(l.amount)}</span>
                  <button type="button" onClick={() => removeLiability(l.id)} className="text-text-muted hover:text-danger" aria-label={t("delete")}>
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
