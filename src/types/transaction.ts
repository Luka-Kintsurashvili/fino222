import type { BudgetCategoryKey } from "@/data/budgetCategories";

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  /** Only meaningful for expenses. */
  category?: BudgetCategoryKey;
  /** Only meaningful for expenses — ties this transaction to a custom tracking project. */
  projectId?: string;
  note: string;
  date: string;
}
