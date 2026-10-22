// Fino bank connection — multi-bank, mixed real + simulated.
// TBC now calls Archil's independent TBC Open Banking mock sandbox for real (see
// _shared/tbcMockClient.ts) — a genuine consent -> OAuth -> accounts exchange over HTTP,
// not generated data. It always resolves to the same fixed demo customer, so every Fino
// user sees identical TBC data. If the mock is unreachable (it does simulate rare outages),
// this falls back to a fixed placeholder account rather than leaving the user stuck.
//
// BOG has no public Open Banking mock available, so it stays simulated (_shared/demoData.ts).
// Real TBC Open Banking (AIS) access for actual bank accounts still requires a National Bank
// of Georgia AISP license, which this project doesn't hold yet — see tbc-consent-start/index.ts
// for the real, currently-dormant OAuth+consent flow this would use once licensed.
// Deploy: supabase functions deploy tbc-demo-connect

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";
import { DEMO_BANKS } from "../_shared/demoData.ts";
import { fetchTbcMockBankData } from "../_shared/tbcMockClient.ts";

const TBC_FALLBACK = { bankId: "tbc", nickname: "დემო ანგარიში", balance: 2450, last4: "0010" };

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

    const { data: existingTbc } = await supabase.from("bank_accounts").select("id").eq("bank_id", "tbc").maybeSingle();
    if (!existingTbc) {
      let tbcRow = TBC_FALLBACK;
      try {
        const mock = await fetchTbcMockBankData();
        const gelAccount = mock.accounts.find((a) => a.currency === "GEL") ?? mock.accounts[0];
        if (gelAccount) {
          tbcRow = {
            bankId: "tbc",
            nickname: gelAccount.name,
            balance: gelAccount.balance,
            last4: gelAccount.iban.slice(-4),
          };
        }
      } catch (e) {
        console.error("TBC mock unreachable, using fallback demo account:", e);
      }
      const { error: insertError } = await supabase.from("bank_accounts").insert({
        user_id: user.id,
        bank_id: tbcRow.bankId,
        nickname: tbcRow.nickname,
        balance: tbcRow.balance,
        last4: tbcRow.last4,
      });
      if (insertError) return jsonError(`Failed to seed TBC account: ${insertError.message}`, 500);
    }

    for (const bank of DEMO_BANKS) {
      const { data: existingAccount } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("bank_id", bank.bankId)
        .maybeSingle();

      if (!existingAccount) {
        const { error: insertError } = await supabase.from("bank_accounts").insert({
          user_id: user.id,
          bank_id: bank.bankId,
          nickname: bank.nickname,
          balance: bank.balance,
          last4: "4821",
        });
        if (insertError) return jsonError(`Failed to seed demo account (${bank.bankId}): ${insertError.message}`, 500);
      }
    }

    return jsonOk({ status: "active" });
  } catch (e) {
    console.error("Unhandled error in tbc-demo-connect function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
