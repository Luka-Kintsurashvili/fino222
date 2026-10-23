import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { BudgetCategoryKey } from "@/data/budgetCategories";

export interface BudgetPlan {
  monthlyIncome: number;
  ruleId: string;
  amounts: Record<BudgetCategoryKey, number>;
}

export function useBudgetPlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("budget_plans").select("*").eq("user_id", user.id).maybeSingle();
    if (!error && data) {
      setPlan({ monthlyIncome: data.monthly_income, ruleId: data.rule_id, amounts: data.amounts });
    } else {
      setPlan(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function savePlan(next: BudgetPlan): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { error } = await supabase.from("budget_plans").upsert({
      user_id: user.id,
      monthly_income: next.monthlyIncome,
      rule_id: next.ruleId,
      amounts: next.amounts,
      updated_at: new Date().toISOString(),
    });
    if (error) return error.message;
    setPlan(next);
    return null;
  }

  return { plan, loading, savePlan, refresh };
}
