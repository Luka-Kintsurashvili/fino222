import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Transaction, TransactionInput } from "@/types/transaction";
import type { BudgetCategoryKey } from "@/data/budgetCategories";

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    if (error) setError(error.message);
    else setTransactions(data as Transaction[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addTransaction(input: TransactionInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        type: input.type,
        amount: input.amount,
        category: input.category ?? null,
        project_id: input.project_id ?? null,
        note: input.note,
        date: input.date,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setTransactions((prev) => [data as Transaction, ...prev]);
    return null;
  }

  async function removeTransaction(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  /** Assigns (or clears, with `projectId: null`) which project a transaction belongs to. */
  async function updateTransactionProject(id: string, projectId: string | null) {
    const { error } = await supabase.from("transactions").update({ project_id: projectId }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, project_id: projectId } : t)));
  }

  const expenses = useMemo(() => transactions.filter((t) => t.type === "expense"), [transactions]);

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

  return {
    transactions,
    expenses,
    loading,
    error,
    addTransaction,
    removeTransaction,
    updateTransactionProject,
    refresh,
    monthlyTotals,
    expensesByCategory,
  };
}
