import { Browser } from "playwright";
import { ScrapeResult } from "./types";

/**
 * Taptap Send scraper.
 *
 * Their /api/fxRates endpoint requires a browser session (cookies set during
 * page load). We let Playwright load the page, intercept the fxRates response,
 * and extract the USD→INR rate directly from the JSON.
 *
 * Response shape:
 *   { availableCountries: [{ isoCountryCode: "US", corridors: [{ isoCountryCode: "IN", fxRate: "95.xx" }] }] }
 */
export async function scrapeTaptap(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  await context.addInitScript(`
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    window.chrome = { runtime: {} };
  `);

  const page = await context.newPage();

  try {
    let capturedRate: number | null = null;

    page.on("response", async (response) => {
      if (!response.url().includes("/api/fxRates")) return;
      try {
        const json = await response.json();
        const countries: Array<{ isoCountryCode: string; corridors: Array<{ isoCountryCode: string; fxRate: string }> }> =
          json?.availableCountries ?? [];
        const us = countries.find((c) => c.isoCountryCode === "US");
        const india = us?.corridors?.find((c) => c.isoCountryCode === "IN");
        if (india?.fxRate) {
          capturedRate = parseFloat(india.fxRate);
        }
      } catch {}
    });

    await page.goto("https://www.taptapsend.com/?lang=en-us", {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    // Give the page time to fire the fxRates request if not yet done
    if (!capturedRate) await page.waitForTimeout(3000);

    if (!capturedRate) throw new Error("fxRates response did not include USD→INR corridor");

    return { providerName: "Taptap Send", usd_inr_rate: capturedRate, fee_usd: 0, success: true };
  } catch (err) {
    return { providerName: "Taptap Send", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  } finally {
    await context.close();
  }
}
