import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { budgetCategories } from "@/data/budgetCategories";
import { formatGEL } from "@/lib/format";
import { useLanguage } from "@/lib/LanguageContext";
import type { Transaction } from "@/types/transaction";

interface TransactionListProps {
  expenses: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionList({ expenses, onDelete }: TransactionListProps) {
  const { t } = useLanguage();

  if (expenses.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm text-text-secondary">{t("noExpenses")}</p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-border-soft">
      {expenses.map((expense) => {
        const category = budgetCategories.find((c) => c.key === expense.category);
        const Icon = category?.icon;
        return (
          <div key={expense.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                category?.colorClass ?? "bg-text-muted"
              }`}
            >
              {Icon && <Icon size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{expense.note || category?.label}</p>
              <p className="text-xs text-text-muted">
                {category?.label} · {expense.date}
              </p>
            </div>
            <p className="shrink-0 font-mono text-sm font-semibold tabular text-danger">
              -{formatGEL(expense.amount)}
            </p>
            <button
              onClick={() => onDelete(expense.id)}
              className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-danger-soft hover:text-danger"
              aria-label={t("delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </Card>
  );
}
