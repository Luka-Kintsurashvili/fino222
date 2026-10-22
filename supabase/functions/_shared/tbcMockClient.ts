// Client for Archil's independent TBC Open Banking mock sandbox
// (https://tbc-bank-mock-open-banking-api.vercel.app) — a faithful simulation of TBC's real
// legacy AIS /0.8 endpoints (consent, OAuth authorization-code flow, accounts, balances,
// transactions), with no JWS signing, certificates or real bank login required.
//
// The mock always resolves to the same fixed synthetic customer ("მოქი მოქიაშვილი"), so every
// Fino user who connects gets identical account/transaction data — consistent demo data for
// everyone, by construction of the mock itself, not something we have to engineer ourselves.
//
// This is a REAL network integration (unlike demoData.ts's generated fake data): we actually
// run the consent -> authorize -> approve -> token -> accounts/transactions exchange against a
// live HTTP API on every connect, following the documented Open Banking protocol.

const MOCK_BASE = "https://tbc-bank-mock-open-banking-api.vercel.app/0.8";
const CLIENT_ID = "mock-documentation";
const REDIRECT_URI = "https://tbc-bank-mock-open-banking-api.vercel.app/mock/callback";

export interface MockAccount {
  resourceId: string;
  iban: string;
  currency: string;
  name: string;
  ownerName: string;
  balance: number;
}

export interface MockTransaction {
  transactionId: string;
  bookingDate: string;
  amount: number;
  note: string;
}

export interface MockBankData {
  accounts: MockAccount[];
  transactionsByAccount: Record<string, MockTransaction[]>;
}

function extractSetCookie(res: Response): string | null {
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  // Keep just the name=value pairs for the follow-up request.
  return raw.split(",").map((c) => c.split(";")[0].trim()).join("; ");
}

async function createConsent(): Promise<string> {
  const res = await fetch(`${MOCK_BASE}/v1/consents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "PSU-ID": "fino-user" },
    body: JSON.stringify({
      access: { accounts: [], balances: [], transactions: [] },
      recurringIndicator: true,
      validUntil: "2026-12-31",
      frequencyPerDay: 4,
      combinedServiceIndicator: false,
    }),
  });
  if (!res.ok) throw new Error(`TBC mock: create consent failed (${res.status})`);
  const data = await res.json();
  return data.consentId as string;
}

/** Follows the authorize redirect to the mock's consent screen, then auto-approves it (standing in for the real PSU's click — the mock has no real customer to click it). Returns the authorization code. */
async function authorizeAndApprove(consentId: string): Promise<string> {
  const authUrl = new URL(`${MOCK_BASE}/psd2/openbanking/oauth/authorize`);
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("scope", `AIS:${consentId}`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("nonce", crypto.randomUUID());
  authUrl.searchParams.set("state", crypto.randomUUID());

  const authRes = await fetch(authUrl.toString(), { redirect: "manual" });
  const mockAuthorizeUrl = authRes.headers.get("location");
  if (!mockAuthorizeUrl) throw new Error("TBC mock: authorize did not return a redirect to the consent screen");
  const cookie = extractSetCookie(authRes);

  const approveRes = await fetch(mockAuthorizeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: "decision=approve",
    redirect: "manual",
  });
  const callbackUrl = approveRes.headers.get("location");
  if (!callbackUrl) throw new Error("TBC mock: approval did not redirect back with a code");
  const code = new URL(callbackUrl, MOCK_BASE).searchParams.get("code");
  if (!code) throw new Error("TBC mock: no authorization code in callback");
  return code;
}

async function exchangeToken(code: string): Promise<string> {
  const res = await fetch(`${MOCK_BASE}/openbanking/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });
  if (!res.ok) throw new Error(`TBC mock: token exchange failed (${res.status})`);
  const data = await res.json();
  return data.access_token as string;
}

async function getAccounts(accessToken: string, consentId: string): Promise<MockAccount[]> {
  const res = await fetch(`${MOCK_BASE}/v1/accounts?withBalance=true`, {
    headers: { Authorization: `Bearer ${accessToken}`, "Consent-ID": consentId },
  });
  if (!res.ok) throw new Error(`TBC mock: read accounts failed (${res.status})`);
  const data = await res.json();
  return (data.accounts ?? []).map((a: Record<string, unknown>) => {
    const balances = (a.balances as { balanceType: string; balanceAmount: { amount: string } }[]) ?? [];
    const booked = balances.find((b) => b.balanceType === "interimBooked") ?? balances[0];
    return {
      resourceId: a.resourceId as string,
      iban: a.iban as string,
      currency: a.currency as string,
      name: (a.displayName as string) ?? (a.name as string),
      ownerName: a.ownerName as string,
      balance: booked ? Number(booked.balanceAmount.amount) : 0,
    };
  });
}

async function getTransactions(accessToken: string, consentId: string, accountId: string): Promise<MockTransaction[]> {
  const res = await fetch(`${MOCK_BASE}/v1/accounts/${accountId}/transactions`, {
    headers: { Authorization: `Bearer ${accessToken}`, "Consent-ID": consentId },
  });
  if (!res.ok) throw new Error(`TBC mock: read transactions failed (${res.status})`);
  const data = await res.json();
  const booked = data?.transactions?.booked ?? [];
  return booked.map((t: Record<string, unknown>) => ({
    transactionId: t.transactionId as string,
    bookingDate: t.bookingDate as string,
    amount: Number((t.transactionAmount as { amount: string }).amount),
    note: (t.remittanceInformationUnstructured as string) ?? (t.creditorName as string) ?? (t.debtorName as string) ?? "TBC",
  }));
}

/** The single account Fino represents as "TBC" to the user (we only show one TBC card, not
 * the mock customer's full multi-currency account list) — kept as one function so connect and
 * sync always agree on which account's data to use. */
export function pickPrimaryAccount(accounts: MockAccount[]): MockAccount | undefined {
  return accounts.find((a) => a.currency === "GEL") ?? accounts[0];
}

/** Runs the full real Open Banking exchange against the mock and returns the fixed demo customer's accounts + transactions. Throws on any failure — callers should fall back to simulated data rather than leave the user stuck (the mock does simulate rare outages). */
export async function fetchTbcMockBankData(): Promise<MockBankData> {
  const consentId = await createConsent();
  const code = await authorizeAndApprove(consentId);
  const accessToken = await exchangeToken(code);
  const accounts = await getAccounts(accessToken, consentId);

  const transactionsByAccount: Record<string, MockTransaction[]> = {};
  for (const acc of accounts) {
    transactionsByAccount[acc.resourceId] = await getTransactions(accessToken, consentId, acc.resourceId);
  }

  return { accounts, transactionsByAccount };
}
