import { Home, ShoppingCart, Car, Popcorn, PiggyBank, MoreHorizontal, type LucideIcon } from "lucide-react";
import type { BudgetRule } from "@/data/budgetRules";

export type BudgetCategoryKey = "housing" | "food" | "transport" | "entertainment" | "savings" | "other";

interface BudgetCategoryDef {
  key: BudgetCategoryKey;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  bucket: "needs" | "wants" | "savings";
  /** Share of its bucket's total this category gets when a preset is applied. */
  weightWithinBucket: number;
}

export const budgetCategories: BudgetCategoryDef[] = [
  { key: "housing", label: "საცხოვრებელი", icon: Home, colorClass: "bg-blue-500", bucket: "needs", weightWithinBucket: 0.5 },
  { key: "food", label: "საკვები", icon: ShoppingCart, colorClass: "bg-sky-500", bucket: "needs", weightWithinBucket: 0.3 },
  { key: "transport", label: "ტრანსპორტი", icon: Car, colorClass: "bg-cyan-500", bucket: "needs", weightWithinBucket: 0.2 },
  { key: "entertainment", label: "გართობა", icon: Popcorn, colorClass: "bg-violet-500", bucket: "wants", weightWithinBucket: 0.6 },
  { key: "other", label: "სხვა", icon: MoreHorizontal, colorClass: "bg-fuchsia-500", bucket: "wants", weightWithinBucket: 0.4 },
  { key: "savings", label: "დანაზოგი", icon: PiggyBank, colorClass: "bg-emerald-500", bucket: "savings", weightWithinBucket: 1 },
];

export function seedAmountsFromRule(rule: BudgetRule, income: number): Record<BudgetCategoryKey, number> {
  const bucketPct: Record<"needs" | "wants" | "savings", number> = {
    needs: rule.needs,
    wants: rule.wants,
    savings: rule.savings,
  };

  const amounts = {} as Record<BudgetCategoryKey, number>;
  for (const cat of budgetCategories) {
    amounts[cat.key] = Math.round(((income * bucketPct[cat.bucket]) / 100) * cat.weightWithinBucket);
  }
  return amounts;
}
