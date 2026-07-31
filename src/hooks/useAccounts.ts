import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { BankAccount, BankAccountInput } from "@/types/account";

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setAccounts(data as BankAccount[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addAccount(input: BankAccountInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setAccounts((prev) => [...prev, data as BankAccount]);
    return null;
  }

  async function removeAccount(id: string) {
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return { accounts, loading, error, addAccount, removeAccount, totalBalance };
}
