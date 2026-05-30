import { Browser } from "playwright";
import { ScrapeResult } from "./types";

/**
 * Remitly quote page loads rate data via their public calculator API.
 * We intercept the network response rather than scraping rendered text,
 * which is faster and less brittle than DOM selectors.
 */
export async function scrapeRemitly(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    let capturedRate: number | null = null;
    let capturedFee: number | null = null;

    // Intercept Remitly's internal pricing API
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("api.remitly.io") && url.includes("quote")) {
        try {
          const json = await response.json();
          // Shape: { data: { exchange_rate, send_fees: [{ amount }] } }
          const data = json?.data ?? json;
          if (data?.exchange_rate) capturedRate = parseFloat(data.exchange_rate);
          if (data?.send_fees?.[0]?.amount) capturedFee = parseFloat(data.send_fees[0].amount);
        } catch {}
      }
    });

    await page.goto("https://www.remitly.com/us/en/india?utm_source=poc", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Fallback: try to read the displayed rate from the DOM
    if (!capturedRate) {
      const rateText = await page
        .locator('[data-testid="exchange-rate-value"], .exchange-rate, [class*="ExchangeRate"]')
        .first()
        .textContent({ timeout: 5000 })
        .catch(() => null);

      if (rateText) {
        const match = rateText.match(/[\d,]+\.?\d*/);
        if (match) capturedRate = parseFloat(match[0].replace(/,/g, ""));
      }
    }

    if (!capturedRate) throw new Error("Could not extract rate from Remitly");

    return {
      providerName: "Remitly",
      usd_inr_rate: capturedRate,
      fee_usd: capturedFee ?? 0,
      success: true,
    };
  } catch (err) {
    return {
      providerName: "Remitly",
      usd_inr_rate: 0,
      fee_usd: 0,
      success: false,
      error: String(err),
    };
  } finally {
    await context.close();
  }
}
