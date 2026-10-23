import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

/** Recurring-payment candidates the user rejected ("not a bill") — kept so detection stops
 * resurfacing them. Dismissal is a name-based allowlist, same key recurringDetect.ts already
 * groups transactions by, so nothing else needs to change to respect it. */
export function useDismissedRecurring() {
  const { user } = useAuth();
  const [dismissedNames, setDismissedNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setDismissedNames([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("dismissed_recurring_payments").select("name");
    if (!error) setDismissedNames((data ?? []).map((r) => r.name));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function dismiss(name: string) {
    if (!user) return;
    setDismissedNames((prev) => (prev.includes(name) ? prev : [...prev, name]));
    await supabase.from("dismissed_recurring_payments").upsert({ user_id: user.id, name }, { onConflict: "user_id,name" });
  }

  return { dismissedNames, dismiss, loading, refresh };
}
