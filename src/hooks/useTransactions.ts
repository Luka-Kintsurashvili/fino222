import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Transaction } from "@/types/transaction";
import type { BudgetCategoryKey } from "@/data/budgetCategories";

function isoDate(monthsAgo: number, day: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  return d.toISOString().slice(0, 10);
}

function seedTransactions(): Transaction[] {
  return [
    { id: "seed-1", type: "income", amount: 2800, note: "ხელფასი", date: isoDate(2, 5) },
    { id: "seed-2", type: "expense", amount: 850, category: "housing", note: "ქირა", date: isoDate(2, 6) },
    { id: "seed-3", type: "expense", amount: 420, category: "food", note: "სუპერმარკეტი", date: isoDate(2, 12) },
    { id: "seed-4", type: "expense", amount: 180, category: "transport", note: "ბენზინი", date: isoDate(2, 18) },
    { id: "seed-5", type: "income", amount: 2800, note: "ხელფასი", date: isoDate(1, 5) },
    { id: "seed-6", type: "expense", amount: 850, category: "housing", note: "ქირა", date: isoDate(1, 6) },
    { id: "seed-7", type: "expense", amount: 390, category: "food", note: "სუპერმარკეტი", date: isoDate(1, 11) },
    { id: "seed-8", type: "expense", amount: 220, category: "entertainment", note: "კინო და გართობა", date: isoDate(1, 20) },
    { id: "seed-9", type: "income", amount: 2950, note: "ხელფასი", date: isoDate(0, 5) },
    { id: "seed-10", type: "expense", amount: 850, category: "housing", note: "ქირა", date: isoDate(0, 6) },
    { id: "seed-11", type: "expense", amount: 310, category: "food", note: "სუპერმარკეტი", date: isoDate(0, 9) },
    { id: "seed-12", type: "expense", amount: 95, category: "transport", note: "ტაქსი", date: isoDate(0, 13) },
  ];
}

export function useTransactions() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("fino-transactions", seedTransactions());

  function addTransaction(t: Omit<Transaction, "id">) {
    setTransactions((prev) => [{ ...t, id: crypto.randomUUID() }, ...prev]);
  }

  function removeTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const expenses = useMemo(
    () => [...transactions].filter((t) => t.type === "expense").sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const monthlyTotals = useMemo(() => {
    const map = new Map<string, { income: number; expenses: number }>();
    for (const t of transactions) {
      const month = t.date.slice(0, 7);
      const entry = map.get(month) ?? { income: 0, expenses: 0 };
      if (t.type === "income") entry.income += t.amount;
      else entry.expenses += t.amount;
      map.set(month, entry);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, totals]) => ({ month, ...totals, leftover: totals.income - totals.expenses }));
  }, [transactions]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<BudgetCategoryKey, number>();
    for (const t of expenses) {
      if (!t.category) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return map;
  }, [expenses]);

  return { transactions, expenses, addTransaction, removeTransaction, monthlyTotals, expensesByCategory };
}
