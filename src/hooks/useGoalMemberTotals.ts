import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { GoalMember } from "@/types/goalMember";

export interface GoalMemberTotal {
  total: number;
  count: number;
}

/** Fetches all member contributions for a set of goals in one query, grouped by goal. */
export function useGoalMemberTotals(goalIds: string[]) {
  const [totals, setTotals] = useState<Record<string, GoalMemberTotal>>({});
  const key = goalIds.join(",");

  useEffect(() => {
    if (!isSupabaseConfigured || goalIds.length === 0) {
      setTotals({});
      return;
    }
    supabase
      .from("goal_members")
      .select("goal_id, contributed_amount")
      .in("goal_id", goalIds)
      .then(({ data }) => {
        const map: Record<string, GoalMemberTotal> = {};
        for (const row of (data as Pick<GoalMember, "goal_id" | "contributed_amount">[]) ?? []) {
          const entry = map[row.goal_id] ?? { total: 0, count: 0 };
          entry.total += row.contributed_amount;
          entry.count += 1;
          map[row.goal_id] = entry;
        }
        setTotals(map);
      });
    // `goalIds` is intentionally excluded: the caller passes a fresh array every
    // render (goals.map(...)), so depending on it directly would refetch forever.
    // `key` (the joined ids) is the real, stable dependency.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return totals;
}
