import { Browser } from "playwright";
import { ScrapeResult } from "./types";

/**
 * Wise publishes its rate via a public compare page and also via
 * api.wise.com/v1/rates?source=USD&target=INR (no auth required for public rates).
 * We try the API first, fall back to DOM scraping.
 */
export async function scrapeWise(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    // Try Wise public rates API first
    const apiResp = await page.goto(
      "https://api.wise.com/v1/rates?source=USD&target=INR",
      { timeout: 15000 }
    );
    if (apiResp?.ok()) {
      const json = await apiResp.json();
      // Shape: [{ rate, source, target }]
      const entry = Array.isArray(json) ? json[0] : json;
      if (entry?.rate) {
        return {
          providerName: "Wise",
          usd_inr_rate: parseFloat(entry.rate),
          fee_usd: 0, // Wise fee is percentage-based; shown separately on their site
          success: true,
        };
      }
    }

    // Fallback: scrape the compare page
    await page.goto("https://wise.com/us/send-money/usd-to-inr", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const rateText = await page
      .locator('[data-testid="exchange-rate"], .exchange-rate__value, [class*="ExchangeRate__value"]')
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);

    if (!rateText) throw new Error("Could not extract rate from Wise DOM");

    const match = rateText.match(/[\d,]+\.?\d*/);
    if (!match) throw new Error("Unexpected rate format from Wise");

    return {
      providerName: "Wise",
      usd_inr_rate: parseFloat(match[0].replace(/,/g, "")),
      fee_usd: 0,
      success: true,
    };
  } catch (err) {
    return {
      providerName: "Wise",
      usd_inr_rate: 0,
      fee_usd: 0,
      success: false,
      error: String(err),
    };
  } finally {
    await context.close();
  }
}
