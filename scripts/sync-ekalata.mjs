// Pulls a fresh snapshot of real discounted grocery prices from ekalata.gov.ge and upserts it
// into Supabase's discount_offers table via the REST API (PostgREST), using the service role
// key to bypass RLS (that table only allows public reads, not writes).
//
// Why this lives here instead of only as a Supabase Edge Function
// (supabase/functions/ekalata-sync): Supabase's own edge-function IP range gets a 403 from
// ekalata's Cloudflare protection even with correct browser headers, while ordinary outbound
// requests (a laptop, a GitHub Actions runner) work fine. This script does the same job from an
// environment ekalata doesn't block — see .github/workflows/ekalata-sync.yml for the schedule.
//
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run manually with:  node scripts/sync-ekalata.mjs

const EKALATA_BASE = "https://ekalata.gov.ge";
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "ka,en;q=0.9",
  Referer: `${EKALATA_BASE}/ka`,
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

async function fetchStores() {
  const res = await fetch(`${EKALATA_BASE}/api/stores`, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`fetch stores failed (${res.status})`);
  return res.json();
}

async function fetchStoreProducts(slug) {
  const res = await fetch(`${EKALATA_BASE}/api/products?store=${encodeURIComponent(slug)}&all=true`, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`fetch products for ${slug} failed (${res.status})`);
  return res.json();
}

async function upsertOffers(rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/discount_offers?on_conflict=store_slug,ekalata_product_id`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`upsert failed (${res.status}): ${await res.text()}`);
}

async function main() {
  const stores = await fetchStores();
  const fetchedAt = new Date().toISOString();
  let total = 0;

  for (const store of stores) {
    let products;
    try {
      products = await fetchStoreProducts(store.slug);
    } catch (e) {
      console.error(`Skipping ${store.slug}:`, e.message);
      continue;
    }
    const rows = products.map((p) => ({
      ekalata_product_id: p.id,
      store_slug: store.slug,
      store_name_ka: store.name_ka,
      store_name_en: store.name_en,
      category_slug: p.category_slug,
      product_name_ka: p.name_ka,
      price_new: Number(p.price_new),
      price_old: p.price_old != null ? Number(p.price_old) : null,
      valid_from: p.valid_from,
      valid_date: p.valid_date,
      fetched_at: fetchedAt,
    }));
    await upsertOffers(rows);
    total += rows.length;
    console.log(`${store.slug}: ${rows.length} offers`);
  }

  console.log(`Done. ${total} offers upserted across ${stores.length} stores.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
