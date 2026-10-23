import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export interface MemoryFact {
  id: string;
  fact: string;
  created_at: string;
}

/** Facts Fino was explicitly told to remember — written only by the chat's remember_fact tool,
 * shown here so the user can see and delete anything that's wrong. */
export function useUserMemory() {
  const { user } = useAuth();
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setFacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("user_memory").select("*").order("created_at", { ascending: false });
    if (!error) setFacts(data as MemoryFact[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function removeFact(id: string) {
    const { error } = await supabase.from("user_memory").delete().eq("id", id);
    if (error) return;
    setFacts((prev) => prev.filter((f) => f.id !== id));
  }

  return { facts, loading, removeFact, refresh };
}
