import { chromium } from "playwright";
import { scrapeRemitly } from "./remitly";
import { scrapeWise } from "./wise";
import { scrapeWesternUnion } from "./westernunion";
import { scrapeXoom } from "./xoom";
import { scrapeICICI } from "./icici";
import { scrapeTaptap } from "./taptap";
import { scrapeTrustpilot } from "./trustpilot";
import { getFallbackRate } from "./fallback";
import { ScrapeResult } from "./types";

async function withFallback(
  name: string,
  fn: () => Promise<ScrapeResult>
): Promise<ScrapeResult> {
  const result = await fn();
  if (result.success) return result;
  console.warn(`[scraper] ${name} failed (${result.error}), using fallback`);
  return getFallbackRate(name);
}

export async function scrapeAllRates(): Promise<ScrapeResult[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const results = await Promise.all([
      withFallback("Remitly",           () => scrapeRemitly(browser)),
      withFallback("Wise",              () => scrapeWise(browser)),
      withFallback("Western Union",     () => scrapeWesternUnion(browser)),
      withFallback("Xoom",              () => scrapeXoom(browser)),
      withFallback("ICICI Money2India", () => scrapeICICI(browser)),
      withFallback("Taptap Send",       () => scrapeTaptap(browser)),
    ]);
    return results;
  } finally {
    await browser.close();
  }
}

export async function scrapeAllTrustpilot() {
  const browser = await chromium.launch({ headless: true });
  try {
    const providers = ["Remitly", "Wise", "Western Union", "Xoom", "ICICI Money2India", "Taptap Send"];
    const results = await Promise.all(
      providers.map((p) => scrapeTrustpilot(browser, p))
    );
    return results;
  } finally {
    await browser.close();
  }
}
