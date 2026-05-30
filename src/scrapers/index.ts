import { chromium } from "playwright";
import { scrapeRemitly } from "./remitly";
import { scrapeWise } from "./wise";
import { scrapeWesternUnion } from "./westernunion";
import { scrapeXoom } from "./xoom";
import { scrapeICICI } from "./icici";
import { scrapeTrustpilot } from "./trustpilot";
import { ScrapeResult } from "./types";

export async function scrapeAllRates(): Promise<ScrapeResult[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    // Run all provider scrapes in parallel
    const results = await Promise.all([
      scrapeRemitly(browser),
      scrapeWise(browser),
      scrapeWesternUnion(browser),
      scrapeXoom(browser),
      scrapeICICI(browser),
    ]);
    return results;
  } finally {
    await browser.close();
  }
}

export async function scrapeAllTrustpilot() {
  const browser = await chromium.launch({ headless: true });
  try {
    const providers = ["Remitly", "Wise", "Western Union", "Xoom", "ICICI Money2India"];
    const results = await Promise.all(
      providers.map((p) => scrapeTrustpilot(browser, p))
    );
    return results;
  } finally {
    await browser.close();
  }
}
