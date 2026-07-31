// PKCE (RFC 7636) helpers shared by the TBC consent-start/callback functions.

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64UrlFromBytes(crypto.getRandomValues(new Uint8Array(32)));
}

export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlFromBytes(new Uint8Array(hash));
}

export function generateState(): string {
  return base64UrlFromBytes(crypto.getRandomValues(new Uint8Array(24)));
}
