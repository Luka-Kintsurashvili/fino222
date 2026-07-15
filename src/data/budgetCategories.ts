import { Home, ShoppingCart, Car, Popcorn, PiggyBank, MoreHorizontal, type LucideIcon } from "lucide-react";
import type { BudgetRule } from "@/data/budgetRules";

export type BudgetCategoryKey = "housing" | "food" | "transport" | "entertainment" | "savings" | "other";

interface BudgetCategoryDef {
  key: BudgetCategoryKey;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  /** Hex equivalent of colorClass, for contexts (SVG charts) that can't use Tailwind classes. */
  color: string;
  bucket: "needs" | "wants" | "savings";
  /** Share of its bucket's total this category gets when a preset is applied. */
  weightWithinBucket: number;
}

export const budgetCategories: BudgetCategoryDef[] = [
  { key: "housing", label: "საცხოვრებელი", icon: Home, colorClass: "bg-blue-500", color: "#3B82F6", bucket: "needs", weightWithinBucket: 0.5 },
  { key: "food", label: "საკვები", icon: ShoppingCart, colorClass: "bg-sky-500", color: "#0EA5E9", bucket: "needs", weightWithinBucket: 0.3 },
  { key: "transport", label: "ტრანსპორტი", icon: Car, colorClass: "bg-cyan-500", color: "#06B6D4", bucket: "needs", weightWithinBucket: 0.2 },
  { key: "entertainment", label: "გართობა", icon: Popcorn, colorClass: "bg-violet-500", color: "#8B5CF6", bucket: "wants", weightWithinBucket: 0.6 },
  { key: "other", label: "სხვა", icon: MoreHorizontal, colorClass: "bg-fuchsia-500", color: "#D946EF", bucket: "wants", weightWithinBucket: 0.4 },
  { key: "savings", label: "დანაზოგი", icon: PiggyBank, colorClass: "bg-emerald-500", color: "#10B981", bucket: "savings", weightWithinBucket: 1 },
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
