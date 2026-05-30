import { chromium } from "playwright";
import { scrapeRemitly } from "./remitly";
import { scrapeWise } from "./wise";
import { scrapeWesternUnion } from "./westernunion";
import { scrapeXoom } from "./xoom";
import { scrapeICICI } from "./icici";
import { scrapeTaptap } from "./taptap";
import { scrapeTrustpilot } from "./trustpilot";
import { getFallbackRate } from "./fallback";
import {
  httpWise,
  httpRemitly,
  httpWesternUnion,
  httpXoom,
  httpICICI,
  httpTaptap,
} from "./http";
import { ScrapeResult } from "./types";

/**
 * Try HTTP first (fastest, least likely to be blocked),
 * then Playwright (handles JS-rendered pages),
 * then the free exchange-rate API fallback (last resort, estimated).
 */
async function scrapeWithChain(
  name: string,
  httpFn: () => Promise<ScrapeResult>,
  browserFn: () => Promise<ScrapeResult>
): Promise<ScrapeResult> {
  // 1. HTTP
  const http = await httpFn();
  if (http.success) {
    console.log(`[http] ✓ ${name}: ${http.usd_inr_rate}`);
    return http;
  }
  console.warn(`[http] ✗ ${name}: ${http.error}`);

  // 2. Playwright
  const browser = await browserFn();
  if (browser.success) {
    console.log(`[playwright] ✓ ${name}: ${browser.usd_inr_rate}`);
    return browser;
  }
  console.warn(`[playwright] ✗ ${name}: ${browser.error}`);

  // 3. Fallback (estimated)
  console.warn(`[fallback] using estimate for ${name}`);
  return getFallbackRate(name);
}

export async function scrapeAllRates(): Promise<ScrapeResult[]> {
  const pw = await chromium.launch({ headless: true });

  try {
    const results = await Promise.all([
      scrapeWithChain("Wise",              () => httpWise(),         () => scrapeWise(pw)),
      scrapeWithChain("Remitly",           () => httpRemitly(),      () => scrapeRemitly(pw)),
      scrapeWithChain("Western Union",     () => httpWesternUnion(), () => scrapeWesternUnion(pw)),
      scrapeWithChain("Xoom",              () => httpXoom(),         () => scrapeXoom(pw)),
      scrapeWithChain("ICICI Money2India", () => httpICICI(),        () => scrapeICICI(pw)),
      scrapeWithChain("Taptap Send",       () => httpTaptap(),       () => scrapeTaptap(pw)),
    ]);
    return results;
  } finally {
    await pw.close();
  }
}

export async function scrapeAllTrustpilot() {
  const browser = await chromium.launch({ headless: true });
  try {
    const providers = ["Remitly", "Wise", "Western Union", "Xoom", "ICICI Money2India", "Taptap Send"];
    return await Promise.all(providers.map((p) => scrapeTrustpilot(browser, p)));
  } finally {
    await browser.close();
  }
}
