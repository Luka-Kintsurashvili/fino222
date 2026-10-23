// Deterministic "exceeded or close to the monthly category budget" detection — pure arithmetic
// over the user's saved budget plan and their own real transactions. Reports hard current facts
// (spent vs. budgeted) rather than projecting/guessing a future outcome.

import type { BudgetCategoryKey } from "@/data/budgetCategories";

export function currentMonthExpensesByCategory(
  expenses: { amount: number; category: BudgetCategoryKey | null; date: string }[]
): Partial<Record<BudgetCategoryKey, number>> {
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const totals: Partial<Record<BudgetCategoryKey, number>> = {};
  for (const e of expenses) {
    if (!e.category || !e.date.startsWith(monthPrefix)) continue;
    totals[e.category] = (totals[e.category] ?? 0) + e.amount;
  }
  return totals;
}

export type BudgetAlertSeverity = "exceeded" | "close";

export interface BudgetPaceAlert {
  category: BudgetCategoryKey;
  severity: BudgetAlertSeverity;
  spent: number;
  budgeted: number;
}

const MIN_BUDGET_TO_FLAG = 30; // ignore trivially small category budgets
const CLOSE_THRESHOLD = 0.85; // 85%+ of budget spent counts as "close"

/** Flags the single category closest to or furthest past its budget this month, if any. */
export function detectBudgetPace(
  amounts: Partial<Record<BudgetCategoryKey, number>>,
  spentByCategory: Partial<Record<BudgetCategoryKey, number>>
): BudgetPaceAlert | null {
  let worst: BudgetPaceAlert | null = null;
  let worstRatio = 0;

  for (const key of Object.keys(amounts) as BudgetCategoryKey[]) {
    const budgeted = amounts[key];
    if (!budgeted || budgeted < MIN_BUDGET_TO_FLAG) continue;
    const spent = spentByCategory[key] ?? 0;
    const ratio = spent / budgeted;
    if (ratio < CLOSE_THRESHOLD) continue;
    if (ratio > worstRatio) {
      worstRatio = ratio;
      worst = { category: key, severity: ratio >= 1 ? "exceeded" : "close", spent, budgeted };
    }
  }

  return worst;
}
