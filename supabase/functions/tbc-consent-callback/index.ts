// Fino TBC Open Banking — exchanges the authorization code TBC redirected back
// with for an access/refresh token pair, once the user approved the consent.
// Called by the frontend's /tbc-callback route.
//
// DORMANT: part of the real OAuth flow (see tbc-consent-start/index.ts) — not
// deployed or called by the client while Fino uses the simulated tbc-demo-connect
// flow instead, pending a National Bank of Georgia AISP license.
//
// Deploy: supabase functions deploy tbc-consent-callback

import { createClient } from "npm:@supabase/supabase-js@2";
import { TBC_BASE_URL, fetchWithTimeout, corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";

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

    const { code, state } = (await req.json()) as { code?: string; state?: string };
    if (!code || !state) return jsonError("code and state are required", 400);

    const clientId = Deno.env.get("TBC_CLIENT_ID");
    const clientSecret = Deno.env.get("TBC_CLIENT_SECRET");
    const redirectUri = Deno.env.get("TBC_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri) {
      return jsonError("TBC_CLIENT_ID / TBC_CLIENT_SECRET / TBC_REDIRECT_URI are not configured on the server.", 500);
    }

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: connection, error: fetchError } = await serviceClient
      .from("tbc_connections")
      .select("consent_state, pkce_verifier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) return jsonError(`Failed to load consent: ${fetchError.message}`, 500);
    if (!connection || connection.consent_state !== state) {
      return jsonError("Consent state mismatch — please restart the TBC connection.", 400);
    }

    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    console.log(`Exchanging TBC authorization code for user ${user.id}...`);
    const tokenRes = await fetchWithTimeout(
      `${TBC_BASE_URL}/openbanking/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          code_verifier: connection.pkce_verifier ?? "",
          client_id: clientId,
        }),
      },
      "TBC token exchange"
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`TBC token exchange error (${tokenRes.status}):`, errText);
      return jsonError(`TBC token exchange error (${tokenRes.status}): ${errText}`, tokenRes.status);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!access_token) return jsonError("TBC token response did not include an access_token.", 502);

    const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);
    const { error: updateError } = await serviceClient
      .from("tbc_connections")
      .update({
        status: "active",
        access_token,
        refresh_token: refresh_token ?? null,
        token_expires_at: expiresAt.toISOString(),
        consent_state: null,
        pkce_verifier: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) return jsonError(`Failed to store tokens: ${updateError.message}`, 500);

    return jsonOk({ status: "active" });
  } catch (e) {
    console.error("Unhandled error in tbc-consent-callback function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
