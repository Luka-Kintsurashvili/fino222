import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Asset, AssetInput } from "@/types/asset";

export function useAssets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setAssets(data as Asset[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Returns an error message on failure, or null on success. */
  async function addAsset(input: AssetInput): Promise<string | null> {
    if (!user) return "საჭიროა ავტორიზაცია";
    const { data, error } = await supabase
      .from("assets")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) {
      setError(error.message);
      return error.message;
    }
    setAssets((prev) => [data as Asset, ...prev]);
    return null;
  }

  async function removeAsset(id: string) {
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  const liquidTotal = assets.filter((a) => a.liquidity === "liquid").reduce((sum, a) => sum + a.value, 0);
  const nonliquidTotal = assets.filter((a) => a.liquidity === "nonliquid").reduce((sum, a) => sum + a.value, 0);

  return { assets, loading, error, addAsset, removeAsset, liquidTotal, nonliquidTotal };
}
