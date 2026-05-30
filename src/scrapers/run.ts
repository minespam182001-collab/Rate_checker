/**
 * Phase 1 sanity check — run this directly to verify scrapers work
 * before wiring them to Supabase and the cron job.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scraper.json src/scrapers/run.ts
 */
import { scrapeAllRates } from "./index";

async function main() {
  console.log("Starting rate scrape...\n");
  const results = await scrapeAllRates();

  for (const r of results) {
    if (r.success) {
      console.log(`✓ ${r.providerName}: 1 USD = ${r.usd_inr_rate.toFixed(4)} INR  (fee: $${r.fee_usd})`);
    } else {
      console.log(`✗ ${r.providerName}: FAILED — ${r.error}`);
    }
  }

  const successes = results.filter((r) => r.success).length;
  console.log(`\n${successes}/${results.length} providers scraped successfully.`);
  if (successes < 3) {
    console.log("WARNING: Fewer than 3 providers succeeded — POC minimum not met.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
