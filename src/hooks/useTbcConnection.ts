import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export type TbcConnectionStatus = "disconnected" | "pending" | "active" | "revoked" | "expired";

async function extractErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    const body = await context.clone().json().catch(() => null);
    if (body?.error) return body.error;
  }
  return (error as { message?: string } | null)?.message || fallback;
}

export function useTbcConnection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TbcConnectionStatus>("disconnected");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setStatus("disconnected");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("tbc-status");
    if (fnError) {
      setError(await extractErrorMessage(fnError, "Failed to load TBC status"));
    } else {
      setStatus((data?.status as TbcConnectionStatus) ?? "disconnected");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  /**
   * Connects a SIMULATED TBC account (real Open Banking access needs a National Bank of
   * Georgia AISP license this project doesn't hold yet — see tbc-consent-start/index.ts
   * for the real, currently-dormant flow). Completes instantly, no redirect needed.
   */
  async function connect(): Promise<string | null> {
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("tbc-demo-connect");
    if (fnError || data?.status !== "active") {
      const message = fnError ? await extractErrorMessage(fnError, "Couldn't connect the demo TBC account") : "Couldn't connect the demo TBC account";
      setError(message);
      return message;
    }
    await refreshStatus();
    return null;
  }

  /** Pulls the latest (simulated) transactions. Returns the number imported, or an error. */
  async function sync(): Promise<{ imported: number } | { error: string }> {
    const { data, error: fnError } = await supabase.functions.invoke("tbc-demo-sync");
    if (fnError) {
      return { error: await extractErrorMessage(fnError, "TBC sync failed") };
    }
    return { imported: data?.imported ?? 0 };
  }

  return { status, loading, error, connect, sync, refreshStatus };
}
