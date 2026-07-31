// Fino TBC Open Banking — reports the current user's connection status.
// The tbc_connections table has no RLS policies for the authenticated role
// (it holds live access/refresh tokens), so the client learns its status only
// through this function, which reads it with the service-role key.
// Deploy: supabase functions deploy tbc-status

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Missing Authorization header", 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return jsonError("Not authenticated", 401);

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await serviceClient
      .from("tbc_connections")
      .select("status, consent_valid_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return jsonError(`Failed to load TBC status: ${error.message}`, 500);

    return jsonOk({ status: data?.status ?? "disconnected", consentValidUntil: data?.consent_valid_until ?? null });
  } catch (e) {
    console.error("Unhandled error in tbc-status function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
