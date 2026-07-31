// Fino TBC sync — SIMULATED (see tbc-demo-connect/index.ts and tbc-sync/index.ts for context).
// Populates a stable 3-month history the first time, then adds one fresh transaction
// on every subsequent sync so repeated syncing still feels meaningful.
// Deploy: supabase functions deploy tbc-demo-sync

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";
import { generateSeedTransactions, generateFreshTransaction } from "../_shared/demoData.ts";

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
    const { data: connection, error: connError } = await serviceClient
      .from("tbc_connections")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (connError) return jsonError(`Failed to load TBC connection: ${connError.message}`, 500);
    if (!connection || connection.status !== "active") {
      return jsonError("No active TBC connection. Connect your TBC account first.", 409);
    }

    const { count: seedCount } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .like("external_id", "demo-seed-%");

    const rows = (seedCount ?? 0) > 0 ? [generateFreshTransaction()] : [...generateSeedTransactions(), generateFreshTransaction()];
    const withUser = rows.map((r) => ({ ...r, user_id: user.id }));

    const { error: insertError } = await supabase
      .from("transactions")
      .upsert(withUser, { onConflict: "user_id,external_id", ignoreDuplicates: true });
    if (insertError) return jsonError(`Failed to save transactions: ${insertError.message}`, 500);

    return jsonOk({ imported: withUser.length });
  } catch (e) {
    console.error("Unhandled error in tbc-demo-sync function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
