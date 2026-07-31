import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Fund, FundInput } from "@/types/fund";

export function useFunds() {
  const { user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setFunds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("funds")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setFunds(data as Fund[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addFund(input: FundInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("funds")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setFunds((prev) => [...prev, data as Fund]);
    return null;
  }

  async function addContribution(id: string, amount: number): Promise<string | null> {
    const fund = funds.find((f) => f.id === id);
    if (!fund) return null;
    const { data, error } = await supabase
      .from("funds")
      .update({ saved_amount: fund.saved_amount + amount })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setFunds((prev) => prev.map((f) => (f.id === id ? (data as Fund) : f)));
    return null;
  }

  async function removeFund(id: string) {
    const { error } = await supabase.from("funds").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setFunds((prev) => prev.filter((f) => f.id !== id));
  }

  return { funds, loading, error, addFund, addContribution, removeFund };
}
