import { Browser } from "playwright";
import { ScrapeResult } from "./types";

export async function scrapeXoom(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    let capturedRate: number | null = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("xoom.com") && url.includes("transfer-quote")) {
        try {
          const json = await response.json();
          const rate = json?.exchangeRate ?? json?.data?.exchangeRate;
          if (rate) capturedRate = parseFloat(rate);
        } catch {}
      }
    });

    await page.goto("https://www.xoom.com/india/sendmoney", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    if (!capturedRate) {
      const text = await page
        .locator('[class*="exchangeRate"], [data-testid="exchange-rate"], .exchange-rate-value')
        .first()
        .textContent({ timeout: 5000 })
        .catch(() => null);

      if (text) {
        const match = text.match(/[\d,]+\.?\d*/);
        if (match) capturedRate = parseFloat(match[0].replace(/,/g, ""));
      }
    }

    if (!capturedRate) throw new Error("Could not extract rate from Xoom");

    return { providerName: "Xoom", usd_inr_rate: capturedRate, fee_usd: 0, success: true };
  } catch (err) {
    return { providerName: "Xoom", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  } finally {
    await context.close();
  }
}
