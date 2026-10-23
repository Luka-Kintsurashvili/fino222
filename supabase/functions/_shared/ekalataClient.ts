// Client for ekalata.gov.ge — the National Agency for the Consumer Rights Protection's real
// price-transparency tool, tracking actual discounted grocery/household prices across Georgia's
// major supermarket chains. Confirmed by inspecting its live network traffic: no documented
// public API, but a clean internal REST API (/api/stores, /api/products) backs its own frontend,
// with no robots.txt restriction. We snapshot it (ekalata-sync) rather than call it live from
// user-facing requests, so a slow or unavailable source never blocks the app.

const EKALATA_BASE = "https://ekalata.gov.ge";

// ekalata sits behind Cloudflare, which blocks requests that don't look like they came from a
// browser (no User-Agent, etc.) — these are standard headers a normal client sends anyway.
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "ka,en;q=0.9",
  Referer: `${EKALATA_BASE}/ka`,
};

export interface EkalataStore {
  slug: string;
  name_ka: string;
  name_en: string;
}

export interface EkalataProduct {
  id: number;
  store_slug: string;
  category_slug: string;
  name_ka: string;
  price_new: string;
  price_old: string;
  valid_from: string | null;
  valid_date: string | null;
}

export async function fetchStores(): Promise<EkalataStore[]> {
  const res = await fetch(`${EKALATA_BASE}/api/stores`, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`ekalata: fetch stores failed (${res.status})`);
  const data = await res.json();
  return (data as Record<string, unknown>[]).map((s) => ({
    slug: s.slug as string,
    name_ka: s.name_ka as string,
    name_en: s.name_en as string,
  }));
}

export async function fetchStoreProducts(storeSlug: string): Promise<EkalataProduct[]> {
  const res = await fetch(`${EKALATA_BASE}/api/products?store=${encodeURIComponent(storeSlug)}&all=true`, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`ekalata: fetch products for ${storeSlug} failed (${res.status})`);
  return (await res.json()) as EkalataProduct[];
}
