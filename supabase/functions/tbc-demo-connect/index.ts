// Fino TBC connection — SIMULATED.
// Real TBC Open Banking (AIS) access requires a National Bank of Georgia AISP license,
// which this project doesn't hold yet (see tbc-consent-start/index.ts for the real,
// currently-dormant OAuth+consent flow this replaces). This version just marks the
// connection active instantly and seeds a demo bank account, so bank-linked features
// can be demonstrated today and swapped for the real flow once licensed.
// Deploy: supabase functions deploy tbc-demo-connect

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";
import { DEMO_BANK_ID } from "../_shared/demoData.ts";

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
    const { error: upsertError } = await serviceClient.from("tbc_connections").upsert({
      user_id: user.id,
      status: "active",
      updated_at: new Date().toISOString(),
    });
    if (upsertError) return jsonError(`Failed to store connection: ${upsertError.message}`, 500);

    const { data: existingAccount } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("bank_id", DEMO_BANK_ID)
      .maybeSingle();

    if (!existingAccount) {
      const { error: insertError } = await supabase.from("bank_accounts").insert({
        user_id: user.id,
        bank_id: DEMO_BANK_ID,
        nickname: "TBC ბანკი (დემო)",
        balance: 2450,
        last4: String(Math.floor(1000 + Math.random() * 9000)),
      });
      if (insertError) return jsonError(`Failed to seed demo account: ${insertError.message}`, 500);
    }

    return jsonOk({ status: "active" });
  } catch (e) {
    console.error("Unhandled error in tbc-demo-connect function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
