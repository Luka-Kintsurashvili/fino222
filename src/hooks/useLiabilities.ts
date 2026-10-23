import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Liability, LiabilityInput } from "@/types/liability";

export function useLiabilities() {
  const { user } = useAuth();
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLiabilities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("liabilities")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setLiabilities(data as Liability[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addLiability(input: LiabilityInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("liabilities")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setLiabilities((prev) => [data as Liability, ...prev]);
    return null;
  }

  async function removeLiability(id: string) {
    const { error } = await supabase.from("liabilities").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setLiabilities((prev) => prev.filter((l) => l.id !== id));
  }

  const total = liabilities.reduce((sum, l) => sum + l.amount, 0);

  return { liabilities, loading, error, addLiability, removeLiability, total, refresh };
}
