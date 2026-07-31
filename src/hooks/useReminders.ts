import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Reminder, ReminderInput } from "@/types/reminder";

export function useReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setReminders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("reminders").select("*").order("due_date", { ascending: true });
    if (error) setError(error.message);
    else setReminders(data as Reminder[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addReminder(input: ReminderInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("reminders")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setReminders((prev) => [...prev, data as Reminder].sort((a, b) => a.due_date.localeCompare(b.due_date)));
    return null;
  }

  async function acknowledgeReminder(id: string) {
    const now = new Date().toISOString();
    const { error } = await supabase.from("reminders").update({ acknowledged_at: now }).eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, acknowledged_at: now } : r)));
  }

  const dueSoon = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return reminders.filter((r) => {
      if (r.acknowledged_at) return false;
      const daysUntilDue = Math.ceil((new Date(r.due_date).getTime() - new Date(today).getTime()) / 86_400_000);
      return daysUntilDue <= r.remind_days_before;
    });
  }, [reminders]);

  return { reminders, loading, error, addReminder, acknowledgeReminder, dueSoon, refresh };
}
