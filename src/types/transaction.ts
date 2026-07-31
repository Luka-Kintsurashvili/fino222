import type { BudgetCategoryKey } from "@/data/budgetCategories";

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  /** Only meaningful for expenses. */
  category: BudgetCategoryKey | null;
  /** Only meaningful for expenses — ties this transaction to a custom tracking project. */
  project_id: string | null;
  note: string;
  date: string;
  /** Set only for transactions imported from a bank, so re-syncing skips ones already imported. */
  external_id: string | null;
  created_at: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category?: BudgetCategoryKey | null;
  project_id?: string | null;
  note: string;
  date: string;
}
