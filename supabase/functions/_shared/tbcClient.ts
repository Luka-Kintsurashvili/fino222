// Shared constants/helpers for the TBC Open Banking (AIS) edge functions.
// Sandbox base shown here; point TBC_API_BASE_URL at TBC's production
// Open Banking host once you're approved and have real credentials.

export const TBC_BASE_URL = Deno.env.get("TBC_API_BASE_URL") || "https://test-openbanking.tbcbank.ge/0.8";
export const FETCH_TIMEOUT_MS = 15000;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function fetchWithTimeout(url: string, init: RequestInit, label: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    console.log(`${label} responded after ${Date.now() - startedAt}ms with status ${res.status}`);
    return res;
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error(`${label} failed after ${Date.now() - startedAt}ms — ${isTimeout ? "timed out" : "network error"}:`, err);
    throw new Error(
      isTimeout
        ? `${label} timed out after ${FETCH_TIMEOUT_MS}ms`
        : `${label} network error: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function jsonOk(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
