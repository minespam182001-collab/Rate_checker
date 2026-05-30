import { Browser } from "playwright";
import { ScrapeResult } from "./types";

export async function scrapeICICI(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    let capturedRate: number | null = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("money2india.com") && (url.includes("rate") || url.includes("exchange"))) {
        try {
          const json = await response.json();
          const rate =
            json?.exchangeRate ??
            json?.rate ??
            json?.data?.exchangeRate ??
            json?.data?.rate;
          if (rate) capturedRate = parseFloat(rate);
        } catch {}
      }
    });

    await page.goto("https://www.money2india.com", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    if (!capturedRate) {
      const text = await page
        .locator('[id*="rate"], [class*="exchange-rate"], [class*="ExchangeRate"], .rate-value')
        .first()
        .textContent({ timeout: 5000 })
        .catch(() => null);

      if (text) {
        const match = text.match(/[\d,]+\.?\d*/);
        if (match) capturedRate = parseFloat(match[0].replace(/,/g, ""));
      }
    }

    if (!capturedRate) throw new Error("Could not extract rate from ICICI Money2India");

    return { providerName: "ICICI Money2India", usd_inr_rate: capturedRate, fee_usd: 0, success: true };
  } catch (err) {
    return { providerName: "ICICI Money2India", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  } finally {
    await context.close();
  }
}
