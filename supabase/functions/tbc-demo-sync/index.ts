// Fino TBC sync — mixed real + simulated (see tbc-demo-connect/index.ts for context).
// Pulls the TBC mock's real (small, fixed) transaction list once, and supplements it with our
// own richer deterministic 3-month categorized history (_shared/demoData.ts) that the real
// mock doesn't provide — needed for budgeting, DTI and recurring-bill detection. Every sync
// after the first just adds one more fixed "fresh activity" row, so repeated syncing still
// feels meaningful without re-importing what's already there.
// Deploy: supabase functions deploy tbc-demo-sync

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";
import { generateSeedTransactions, generateFreshTransaction } from "../_shared/demoData.ts";
import { fetchTbcMockBankData, pickPrimaryAccount } from "../_shared/tbcMockClient.ts";

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

    const isFirstSync = (seedCount ?? 0) === 0;
    const rows = isFirstSync ? [...generateSeedTransactions(), generateFreshTransaction()] : [generateFreshTransaction()];

    if (isFirstSync) {
      try {
        const mock = await fetchTbcMockBankData();
        const primaryAccount = pickPrimaryAccount(mock.accounts);
        // Only the one account Fino actually shows as "TBC" (see tbc-demo-connect) — the mock
        // customer's other, unrepresented accounts must not silently add duplicate income/expenses.
        const txns = primaryAccount ? (mock.transactionsByAccount[primaryAccount.resourceId] ?? []) : [];
        for (const t of txns) {
          rows.push({
            type: t.amount >= 0 ? "income" : "expense",
            amount: Math.abs(t.amount),
            category: null,
            note: t.note,
            date: t.bookingDate,
            external_id: `tbc-mock-${primaryAccount!.resourceId}-${t.transactionId}`,
          });
        }
      } catch (e) {
        // The mock does simulate rare outages — fall through with just our own generated data
        // rather than fail the whole sync over a flaky third-party service.
        console.error("TBC mock transactions unreachable, continuing with simulated data only:", e);
      }
    }

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
