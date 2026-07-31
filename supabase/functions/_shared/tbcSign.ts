// Shared helper for TBC Open Banking (AIS) request signing.
//
// TBC's AIS API is Berlin-Group NextGenPSD2-style and expects every request to
// carry a `Digest` header (SHA-256 of the body) and an `X-JWS-Signature` header
// (a detached JWS over the body, signed with the TPP's registered signing key).
//
// NOTE: the exact header/claim set below follows the standard Berlin-Group
// detached-JWS profile (RFC 7515 Appendix F + RFC 7797 b64:false), but TBC's
// public docs don't publish a byte-exact spec. Validate this against real
// responses from TBC's sandbox once TBC_SIGNING_KEY/TBC_SIGNING_KID are set —
// a signature mismatch will show up as a 4xx from TBC with a clear error body.

const ALG = Deno.env.get("TBC_SIGNING_ALG") || "PS256";

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  return base64FromBytes(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToBytes(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importSigningKey(pem: string): Promise<CryptoKey> {
  const keyBytes = pemToBytes(pem);
  const algorithm: RsaHashedImportParams =
    ALG === "RS256"
      ? { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }
      : { name: "RSA-PSS", hash: "SHA-256" };
  return crypto.subtle.importKey("pkcs8", keyBytes, algorithm, false, ["sign"]);
}

/** SHA-256 digest of the request body, formatted as required by the `Digest` header. */
export async function computeDigest(body: string): Promise<string> {
  const bodyBytes = new TextEncoder().encode(body);
  const hash = await crypto.subtle.digest("SHA-256", bodyBytes);
  return `SHA-256=${base64FromBytes(new Uint8Array(hash))}`;
}

/**
 * Produces a detached-payload JWS (RFC 7515 Appendix F) over `body`, suitable
 * for the `X-JWS-Signature` header. The signing key/kid must be TBC-issued.
 */
export async function signDetachedJws(body: string): Promise<string> {
  const privateKeyPem = Deno.env.get("TBC_SIGNING_KEY");
  const kid = Deno.env.get("TBC_SIGNING_KID");
  if (!privateKeyPem || !kid) {
    throw new Error("TBC_SIGNING_KEY / TBC_SIGNING_KID are not configured on the server.");
  }

  const protectedHeader = { alg: ALG, kid, b64: false, crit: ["b64"] };
  const protectedHeaderB64 = base64UrlFromBytes(new TextEncoder().encode(JSON.stringify(protectedHeader)));

  const signingInput = new Uint8Array([
    ...new TextEncoder().encode(protectedHeaderB64 + "."),
    ...new TextEncoder().encode(body),
  ]);

  const key = await importSigningKey(privateKeyPem);
  const signAlgorithm: RsaPssParams | AlgorithmIdentifier =
    ALG === "RS256" ? "RSASSA-PKCS1-v1_5" : { name: "RSA-PSS", saltLength: 32 };
  const signature = await crypto.subtle.sign(signAlgorithm, key, signingInput);

  return `${protectedHeaderB64}..${base64UrlFromBytes(new Uint8Array(signature))}`;
}

/** Builds the standard AIS signing headers for a request with the given body. */
export async function buildSigningHeaders(body: string): Promise<{ Digest: string; "X-JWS-Signature": string }> {
  const [digest, jws] = await Promise.all([computeDigest(body), signDetachedJws(body)]);
  return { Digest: digest, "X-JWS-Signature": jws };
}
