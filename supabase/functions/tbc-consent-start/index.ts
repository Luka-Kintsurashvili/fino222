// Fino TBC Open Banking — starts an AIS consent for the current user and
// returns the URL to redirect their browser to for TBC's login/consent screen.
//
// DORMANT: real TBC Open Banking (AIS) access requires a National Bank of Georgia
// AISP license, which this project doesn't hold yet. The app currently uses
// tbc-demo-connect/tbc-demo-sync (simulated data) instead — see useTbcConnection.ts.
// This function is real, tested-shape code kept for when that license is in place;
// it is not deployed or called by the client today.
//
// Deploy: supabase functions deploy tbc-consent-start
// Configure: supabase secrets set TBC_CLIENT_ID=... TBC_CLIENT_SECRET=... \
//   TBC_SIGNING_KEY=... TBC_SIGNING_KID=... TBC_REDIRECT_URI=https://yourapp.ge/tbc-callback

import { createClient } from "npm:@supabase/supabase-js@2";
import { TBC_BASE_URL, fetchWithTimeout, corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";
import { buildSigningHeaders } from "../_shared/tbcSign.ts";
import { generateCodeVerifier, deriveCodeChallenge, generateState } from "../_shared/pkce.ts";

const CONSENT_VALID_DAYS = 90;

async function getAppAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetchWithTimeout(
    `${TBC_BASE_URL}/openbanking/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${basicAuth}` },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    },
    "TBC app token request"
  );
  if (!res.ok) throw new Error(`TBC app token error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  if (!data.access_token) throw new Error("TBC app token response did not include an access_token.");
  return data.access_token as string;
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
    const redirectUri = Deno.env.get("TBC_REDIRECT_URI");
    if (!clientId || !clientSecret || !redirectUri) {
      return jsonError("TBC_CLIENT_ID / TBC_CLIENT_SECRET / TBC_REDIRECT_URI are not configured on the server.", 500);
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await deriveCodeChallenge(codeVerifier);
    const state = generateState();

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + CONSENT_VALID_DAYS);

    const consentBody = JSON.stringify({
      access: {
        recurringIndicator: true,
        validUntil: validUntil.toISOString().slice(0, 10),
        frequencyPerDay: 4,
        combinedServiceIndicator: false,
      },
    });

    console.log(`Starting TBC consent for user ${user.id}...`);
    const appToken = await getAppAccessToken(clientId, clientSecret);
    const signingHeaders = await buildSigningHeaders(consentBody);
    const psuIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";

    const consentRes = await fetchWithTimeout(
      `${TBC_BASE_URL}/v1/consents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`,
          "X-Request-ID": crypto.randomUUID(),
          "PSU-IP-Address": psuIp,
          "TPP-Redirect-URI": redirectUri,
          ...signingHeaders,
        },
        body: consentBody,
      },
      "TBC create consent"
    );

    if (!consentRes.ok) {
      const errText = await consentRes.text();
      console.error(`TBC create consent error (${consentRes.status}):`, errText);
      return jsonError(`TBC create consent error (${consentRes.status}): ${errText}`, consentRes.status);
    }

    const consentData = await consentRes.json();
    const consentId: string | undefined = consentData.consentId;
    if (!consentId) return jsonError("TBC consent response did not include a consentId.", 502);

    const authorizeBase: string =
      consentData?._links?.scaOAuth?.href || `${TBC_BASE_URL}/openbanking/oauth/authorize`;

    const authorizeUrl = new URL(authorizeBase);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("scope", `AIS:${consentId}`);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: upsertError } = await serviceClient.from("tbc_connections").upsert({
      user_id: user.id,
      consent_id: consentId,
      consent_state: state,
      pkce_verifier: codeVerifier,
      status: "pending",
      consent_valid_until: validUntil.toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    });
    if (upsertError) {
      console.error("Failed to store TBC consent:", upsertError);
      return jsonError(`Failed to store consent: ${upsertError.message}`, 500);
    }

    return jsonOk({ authorizeUrl: authorizeUrl.toString() });
  } catch (e) {
    console.error("Unhandled error in tbc-consent-start function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
