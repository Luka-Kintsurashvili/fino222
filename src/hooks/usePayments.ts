import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { PaymentInput, RecurringPayment } from "@/types/payment";

export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("calendar_payments")
      .select("*")
      .order("day_of_month", { ascending: true });
    if (error) setError(error.message);
    else setPayments(data as RecurringPayment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addPayment(input: PaymentInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("calendar_payments")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setPayments((prev) => [...prev, data as RecurringPayment].sort((a, b) => a.day_of_month - b.day_of_month));
    return null;
  }

  async function deletePayment(id: string) {
    const { error } = await supabase.from("calendar_payments").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  return { payments, loading, error, addPayment, deletePayment };
}
