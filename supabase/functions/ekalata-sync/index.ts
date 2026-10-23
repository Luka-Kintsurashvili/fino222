// Pulls a fresh snapshot of real discounted prices from ekalata.gov.ge into discount_offers.
// Meant to run on a schedule (daily), not per-user — triggered by a cron job (e.g. Supabase's
// pg_cron hitting this URL) rather than from the client, so it's protected by a shared secret
// instead of a user JWT. Deploy with: supabase functions deploy ekalata-sync --no-verify-jwt
// Configure: supabase secrets set EKALATA_SYNC_SECRET=some-random-string

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonError, jsonOk } from "../_shared/tbcClient.ts";
import { fetchStores, fetchStoreProducts } from "../_shared/ekalataClient.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expectedSecret = Deno.env.get("EKALATA_SYNC_SECRET");
  if (expectedSecret && req.headers.get("x-sync-secret") !== expectedSecret) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const stores = await fetchStores();
    const fetchedAt = new Date().toISOString();
    let totalUpserted = 0;
    const errors: string[] = [];

    for (const store of stores) {
      try {
        const products = await fetchStoreProducts(store.slug);
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
        if (rows.length === 0) continue;

        const { error } = await serviceClient.from("discount_offers").upsert(rows, { onConflict: "store_slug,ekalata_product_id" });
        if (error) {
          errors.push(`${store.slug}: ${error.message}`);
          continue;
        }
        totalUpserted += rows.length;
      } catch (e) {
        errors.push(`${store.slug}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return jsonOk({ stores: stores.length, upserted: totalUpserted, errors });
  } catch (e) {
    console.error("Unhandled error in ekalata-sync function:", e);
    return jsonError(e instanceof Error ? e.message : String(e), 500);
  }
});
