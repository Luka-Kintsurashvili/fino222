// Deterministic "on pace to blow the monthly category budget" detection — pure arithmetic
// over the user's saved budget plan and their own transactions, no guessing.

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

export interface BudgetPaceAlert {
  category: BudgetCategoryKey;
  spent: number;
  budgeted: number;
  projectedEndOfMonth: number;
}

const MIN_BUDGET_TO_FLAG = 30; // ignore trivially small category budgets
const OVER_PACE_MARGIN = 1.15; // projected end-of-month spend must exceed budget by at least 15%

/** Flags the single category furthest over pace to exceed its budget by month end, if any. */
export function detectBudgetPace(
  amounts: Partial<Record<BudgetCategoryKey, number>>,
  spentByCategory: Partial<Record<BudgetCategoryKey, number>>,
  today: Date = new Date()
): BudgetPaceAlert | null {
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthFraction = dayOfMonth / daysInMonth;
  if (monthFraction <= 0) return null;

  let worst: BudgetPaceAlert | null = null;
  let worstRatio = 0;

  for (const key of Object.keys(amounts) as BudgetCategoryKey[]) {
    const budgeted = amounts[key];
    if (!budgeted || budgeted < MIN_BUDGET_TO_FLAG) continue;
    const spent = spentByCategory[key] ?? 0;
    const projectedEndOfMonth = spent / monthFraction;
    const ratio = projectedEndOfMonth / budgeted;
    if (ratio > OVER_PACE_MARGIN && ratio > worstRatio) {
      worstRatio = ratio;
      worst = { category: key, spent, budgeted, projectedEndOfMonth };
    }
  }

  return worst;
}
