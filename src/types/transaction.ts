import type { BudgetCategoryKey } from "@/data/budgetCategories";

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  /** Only meaningful for expenses. */
  category?: BudgetCategoryKey;
  note: string;
  date: string;
}
