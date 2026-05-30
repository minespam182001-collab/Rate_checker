import { Browser } from "playwright";
import { ScrapeResult } from "./types";

/**
 * Taptap Send shows its rate on the home calculator.
 * We intercept their pricing API first; fall back to DOM if needed.
 */
export async function scrapeTaptap(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

  try {
    let capturedRate: number | null = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (
        url.includes("taptapsend.com") &&
        (url.includes("quote") ||
          url.includes("rate") ||
          url.includes("price") ||
          url.includes("calculate"))
      ) {
        try {
          const json = await response.json();
          const rate =
            json?.exchangeRate ??
            json?.exchange_rate ??
            json?.rate ??
            json?.data?.exchangeRate ??
            json?.data?.rate;
          if (rate) capturedRate = parseFloat(rate);
        } catch {}
      }
    });

    await page.goto("https://www.taptapsend.com/?lang=en-us", {
      waitUntil: "load",
      timeout: 30000,
    });

    // Give the calculator a moment to render
    await page.waitForTimeout(3000);

    if (!capturedRate) {
      const selectors = [
        '[data-testid*="rate"]',
        '[data-testid*="exchange"]',
        '[class*="exchangeRate"]',
        '[class*="ExchangeRate"]',
        '[class*="exchange-rate"]',
        '[class*="rate-value"]',
        '[class*="RateValue"]',
      ];
      for (const sel of selectors) {
        const text = await page
          .locator(sel)
          .first()
          .textContent({ timeout: 2000 })
          .catch(() => null);
        if (text) {
          const match = text.match(/[\d,]+\.?\d*/);
          if (match) {
            const parsed = parseFloat(match[0].replace(/,/g, ""));
            // Sanity check: USD/INR should be between 70 and 120
            if (parsed > 70 && parsed < 120) {
              capturedRate = parsed;
              break;
            }
          }
        }
      }
    }

    if (!capturedRate) throw new Error("Could not extract rate from Taptap Send");

    return {
      providerName: "Taptap Send",
      usd_inr_rate: capturedRate,
      fee_usd: 0,
      success: true,
    };
  } catch (err) {
    return {
      providerName: "Taptap Send",
      usd_inr_rate: 0,
      fee_usd: 0,
      success: false,
      error: String(err),
    };
  } finally {
    await context.close();
  }
}
