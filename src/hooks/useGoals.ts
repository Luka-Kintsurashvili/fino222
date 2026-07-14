import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Goal, GoalInput } from "@/types/goal";

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setGoals(data as Goal[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addGoal(input: GoalInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("goals")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setGoals((prev) => [data as Goal, ...prev]);
    return null;
  }

  async function updateGoal(id: string, input: Partial<GoalInput>): Promise<string | null> {
    const { data, error } = await supabase.from("goals").update(input).eq("id", id).select().single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setGoals((prev) => prev.map((g) => (g.id === id ? (data as Goal) : g)));
    return null;
  }

  async function deleteGoal(id: string): Promise<string | null> {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return error.message;
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));
    return null;
  }

  return { goals, loading, error, addGoal, updateGoal, deleteGoal, refresh };
}
