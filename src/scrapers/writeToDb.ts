/**
 * Standalone script — run by GitHub Actions.
 * Runs all scrapers and writes results directly to Supabase.
 * Does NOT go through the Next.js API route, so Playwright works fine.
 */

import { createClient } from "@supabase/supabase-js";
import { scrapeAllRates } from "./index";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const db = createClient(url, key, { auth: { persistSession: false } });

  console.log("Starting scrape...");
  const results = await scrapeAllRates();

  const { data: providers } = await db.from("providers").select("id, name");
  const providerMap = Object.fromEntries(
    (providers ?? []).map((p: { name: string; id: string }) => [p.name, p.id])
  );

  let written = 0;
  let skipped = 0;

  for (const r of results) {
    if (!r.success) { skipped++; continue; }
    const providerId = providerMap[r.providerName];
    if (!providerId) { console.warn(`  Unknown provider: ${r.providerName}`); skipped++; continue; }

    const { error } = await db.from("rates").insert({
      provider_id: providerId,
      usd_inr_rate: r.usd_inr_rate,
      fee_usd: r.fee_usd,
      scraped_at: new Date().toISOString(),
      is_stale: false,
    });

    if (error) {
      console.error(`  Failed to write ${r.providerName}:`, error.message);
      skipped++;
    } else {
      console.log(`  ✓ ${r.providerName}: ${r.usd_inr_rate} INR`);
      written++;
    }
  }

  console.log(`\nDone: ${written} written, ${skipped} skipped`);
  if (written === 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
