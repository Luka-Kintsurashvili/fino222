// Fino TBC sync — pulls account movements from TBC's AIS/Open Banking API using
// the per-user access token established via tbc-consent-start/tbc-consent-callback,
// and imports them as transactions for the calling user.
//
// DORMANT: real flow, not deployed or called by the client — Fino uses
// tbc-demo-sync instead, pending a National Bank of Georgia AISP license.
//
// Deploy: supabase functions deploy tbc-sync
// Requires the user to have already connected via the TBC consent flow — see
// tbc-consent-start/index.ts.

import { createClient } from "npm:@supabase/supabase-js@2";
import { TBC_BASE_URL, fetchWithTimeout, corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";
import { buildSigningHeaders } from "../_shared/tbcSign.ts";

const SYNC_WINDOW_DAYS = 90;
const TOKEN_REFRESH_MARGIN_MS = 60_000;

interface TbcAmount {
  amount: string;
  currency: string;
}

interface TbcTransaction {
  transactionId?: string;
  entryReference?: string;
  transactionAmount?: TbcAmount;
  bookingDate?: string;
  valueDate?: string;
  remittanceInformationUnstructured?: string;
  creditorName?: string;
  debtorName?: string;
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetchWithTimeout(
    `${TBC_BASE_URL}/openbanking/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: clientId }),
    },
    "TBC token refresh"
  );
  if (!res.ok) throw new Error(`TBC token refresh error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  if (!data.access_token) throw new Error("TBC token refresh response did not include an access_token.");
  return data;
}

async function tbcGet(path: string, accessToken: string, consentId: string, psuIp: string): Promise<Response> {
  const signingHeaders = await buildSigningHeaders("");
  return fetchWithTimeout(
    `${TBC_BASE_URL}${path}`,
    {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Consent-ID": consentId,
        "X-Request-ID": crypto.randomUUID(),
        "PSU-IP-Address": psuIp,
        ...signingHeaders,
      },
    },
    `TBC GET ${path}`
  );
}

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

    const clientId = Deno.env.get("TBC_CLIENT_ID");
    const clientSecret = Deno.env.get("TBC_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return jsonError("TBC_CLIENT_ID / TBC_CLIENT_SECRET are not configured on the server.", 500);
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: connection, error: fetchError } = await serviceClient
      .from("tbc_connections")
      .select("consent_id, status, access_token, refresh_token, token_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) return jsonError(`Failed to load TBC connection: ${fetchError.message}`, 500);
    if (!connection || connection.status !== "active" || !connection.consent_id || !connection.access_token) {
      return jsonError("No active TBC connection. Connect your TBC account first.", 409);
    }

    let accessToken = connection.access_token as string;
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at as string).getTime() : 0;
    if (Date.now() > expiresAt - TOKEN_REFRESH_MARGIN_MS) {
      if (!connection.refresh_token) return jsonError("TBC access token expired and no refresh token is stored. Reconnect your TBC account.", 409);
      console.log(`Refreshing TBC access token for user ${user.id}...`);
      const refreshed = await refreshAccessToken(connection.refresh_token as string, clientId, clientSecret);
      accessToken = refreshed.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000);
      await serviceClient
        .from("tbc_connections")
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token ?? connection.refresh_token,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    const psuIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const consentId = connection.consent_id as string;

    console.log(`Fetching TBC account list for user ${user.id}...`);
    const accountsRes = await tbcGet("/v1/accounts?withBalance=false", accessToken, consentId, psuIp);
    if (!accountsRes.ok) {
      const errText = await accountsRes.text();
      console.error(`TBC accounts error (${accountsRes.status}):`, errText);
      return jsonError(`TBC accounts error (${accountsRes.status}): ${errText}`, accountsRes.status);
    }
    const accountsData = await accountsRes.json();
    const accountIds: string[] = (accountsData.accounts ?? []).map((a: { resourceId?: string; iban?: string }) => a.resourceId || a.iban).filter(Boolean);

    const periodTo = new Date();
    const periodFrom = new Date();
    periodFrom.setDate(periodFrom.getDate() - SYNC_WINDOW_DAYS);
    const dateFrom = periodFrom.toISOString().slice(0, 10);
    const dateTo = periodTo.toISOString().slice(0, 10);

    const allTransactions: TbcTransaction[] = [];
    for (const accountId of accountIds) {
      console.log(`Fetching TBC transactions for account ${accountId}...`);
      const txRes = await tbcGet(
        `/v1/accounts/${encodeURIComponent(accountId)}/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}&bookingStatus=booked`,
        accessToken,
        consentId,
        psuIp
      );
      if (!txRes.ok) {
        console.error(`TBC transactions error for account ${accountId} (${txRes.status}):`, await txRes.text());
        continue;
      }
      const txData = await txRes.json();
      const booked: TbcTransaction[] = txData?.transactions?.booked ?? [];
      allTransactions.push(...booked);
    }

    console.log(`TBC returned ${allTransactions.length} transaction(s) across ${accountIds.length} account(s).`);

    const rows = allTransactions
      .filter((t) => (t.transactionId || t.entryReference) && t.transactionAmount?.amount)
      .map((t) => {
        const amount = parseFloat(t.transactionAmount!.amount);
        return {
          user_id: user.id,
          type: amount < 0 ? "expense" : "income",
          amount: Math.abs(amount),
          category: null,
          project_id: null,
          note: t.remittanceInformationUnstructured || t.creditorName || t.debtorName || "TBC გადარიცხვა",
          date: (t.bookingDate ?? t.valueDate ?? new Date().toISOString()).slice(0, 10),
          external_id: t.transactionId || t.entryReference,
        };
      });

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("transactions")
        .upsert(rows, { onConflict: "user_id,external_id", ignoreDuplicates: true });
      if (insertError) {
        console.error("Failed to insert synced transactions:", insertError);
        return jsonError(`Failed to save transactions: ${insertError.message}`, 500);
      }
    }

    return jsonOk({ fetched: allTransactions.length, imported: rows.length });
  } catch (e) {
    console.error("Unhandled error in tbc-sync function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
