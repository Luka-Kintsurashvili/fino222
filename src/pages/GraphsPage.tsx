import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { SubPageHeader } from "@/components/ui/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { budgetCategories } from "@/data/budgetCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { formatGEL, georgianMonth } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";

function monthLabel(monthKey: string): string {
  const [, month] = monthKey.split("-");
  return georgianMonth(Number(month) - 1).slice(0, 3);
}

export function GraphsPage() {
  const { t } = useLanguage();
  const { monthlyTotals, expensesByCategory } = useTransactions();

  const incomeData = monthlyTotals.map((m) => ({ label: monthLabel(m.month), value: m.income }));
  const leftoverData = monthlyTotals.map((m) => ({ label: monthLabel(m.month), value: m.leftover }));
  const categoryData = budgetCategories
    .map((cat) => ({ label: cat.label, value: expensesByCategory.get(cat.key) ?? 0, color: cat.color }))
    .filter((d) => d.value > 0);

  const totalIncome = monthlyTotals.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyTotals.reduce((sum, m) => sum + m.expenses, 0);
  const net = totalIncome - totalExpenses;

  return (
    <div className="space-y-5">
      <SubPageHeader title={t("navGraphs")} subtitle={t("graphsSubtitle")} />

      <div className="grid grid-cols-3 gap-2.5">
        <Card className="!p-3.5">
          <TrendingUp size={16} className="text-success" />
          <p className="mt-2 text-[10px] text-text-muted">{t("totalIncome")}</p>
          <p className="mt-0.5 truncate font-mono text-sm font-bold tabular text-text-primary">{formatGEL(totalIncome)}</p>
        </Card>
        <Card className="!p-3.5">
          <TrendingDown size={16} className="text-danger" />
          <p className="mt-2 text-[10px] text-text-muted">{t("totalExpenses")}</p>
          <p className="mt-0.5 truncate font-mono text-sm font-bold tabular text-text-primary">{formatGEL(totalExpenses)}</p>
        </Card>
        <Card className="!p-3.5">
          <Wallet size={16} className={net >= 0 ? "text-accent" : "text-danger"} />
          <p className="mt-2 text-[10px] text-text-muted">{t("net")}</p>
          <p className={`mt-0.5 truncate font-mono text-sm font-bold tabular ${net >= 0 ? "text-text-primary" : "text-danger"}`}>
            {formatGEL(net)}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">{t("incomeByMonth")}</h2>
        {incomeData.length > 0 ? (
          <BarChart data={incomeData} formatValue={(v) => formatGEL(v)} />
        ) : (
          <p className="py-6 text-center text-sm text-text-muted">{t("noData")}</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">{t("expensesByCategory")}</h2>
        <DonutChart data={categoryData} formatValue={(v) => formatGEL(v)} centerLabel={t("totalExpenses")} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-text-primary">{t("leftoverByMonth")}</h2>
        {leftoverData.length > 0 ? (
          <BarChart data={leftoverData} formatValue={(v) => formatGEL(v)} />
        ) : (
          <p className="py-6 text-center text-sm text-text-muted">{t("noData")}</p>
        )}
      </Card>
    </div>
  );
}
