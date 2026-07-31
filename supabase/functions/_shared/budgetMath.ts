// Deno-side duplicate of src/data/budgetRules.ts + src/data/budgetCategories.ts's allocation
// logic (Deno can't resolve the `@/` Vite alias, so this stays manually in sync).

export interface BudgetRule {
  id: string;
  label: string;
  needs: number;
  wants: number;
  savings: number;
}

export const BUDGET_RULES: BudgetRule[] = [
  { id: "classic", label: "50/30/20 კლასიკური", needs: 50, wants: 30, savings: 20 },
  { id: "economic", label: "70/20/10 ეკონომიური", needs: 70, wants: 20, savings: 10 },
  { id: "zero-based", label: "Zero-Based", needs: 55, wants: 15, savings: 30 },
  { id: "aggressive", label: "აგრესიული ინვესტორი", needs: 50, wants: 10, savings: 40 },
];

interface BudgetCategoryDef {
  key: string;
  label: string;
  bucket: "needs" | "wants" | "savings";
  weightWithinBucket: number;
}

const BUDGET_CATEGORIES: BudgetCategoryDef[] = [
  { key: "housing", label: "საცხოვრებელი", bucket: "needs", weightWithinBucket: 0.5 },
  { key: "food", label: "საკვები", bucket: "needs", weightWithinBucket: 0.3 },
  { key: "transport", label: "ტრანსპორტი", bucket: "needs", weightWithinBucket: 0.2 },
  { key: "entertainment", label: "გართობა", bucket: "wants", weightWithinBucket: 0.6 },
  { key: "other", label: "სხვა", bucket: "wants", weightWithinBucket: 0.4 },
  { key: "savings", label: "დანაზოგი", bucket: "savings", weightWithinBucket: 1 },
];

export function seedAmountsFromRule(rule: BudgetRule, income: number): { label: string; amount: number }[] {
  const bucketPct: Record<"needs" | "wants" | "savings", number> = {
    needs: rule.needs,
    wants: rule.wants,
    savings: rule.savings,
  };
  return BUDGET_CATEGORIES.map((cat) => ({
    label: cat.label,
    amount: Math.round(((income * bucketPct[cat.bucket]) / 100) * cat.weightWithinBucket),
  }));
}
