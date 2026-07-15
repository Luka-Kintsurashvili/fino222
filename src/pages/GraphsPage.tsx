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
  const leftoverData = monthlyTotals.map((m) => ({
    label: monthLabel(m.month),
    value: m.leftover,
    colorClass: m.leftover >= 0 ? "bg-success" : "bg-danger",
  }));
  const categoryData = budgetCategories
    .map((cat) => ({ label: cat.label, value: expensesByCategory.get(cat.key) ?? 0, color: cat.color }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      <SubPageHeader title={t("navGraphs")} subtitle={t("graphsSubtitle")} />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-text-primary">{t("incomeByMonth")}</h2>
        {incomeData.length > 0 ? (
          <BarChart data={incomeData} formatValue={(v) => formatGEL(v)} defaultColorClass="bg-success" />
        ) : (
          <p className="py-6 text-center text-sm text-text-muted">{t("noData")}</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-text-primary">{t("expensesByCategory")}</h2>
        <DonutChart data={categoryData} formatValue={(v) => formatGEL(v)} />
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-text-primary">{t("leftoverByMonth")}</h2>
        {leftoverData.length > 0 ? (
          <BarChart data={leftoverData} formatValue={(v) => formatGEL(v)} />
        ) : (
          <p className="py-6 text-center text-sm text-text-muted">{t("noData")}</p>
        )}
      </Card>
    </div>
  );
}
