import { Browser } from "playwright";
import { ScrapeResult } from "./types";

/**
 * Western Union renders its calculator client-side. We navigate to the
 * send-money page, wait for the rate to appear in the DOM, then read it.
 */
export async function scrapeWesternUnion(browser: Browser): Promise<ScrapeResult> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  const page = await context.newPage();

  try {
    let capturedRate: number | null = null;
    let capturedFee: number | null = null;

    // Intercept WU pricing API responses
    page.on("response", async (response) => {
      const url = response.url();
      if (
        (url.includes("westernunion.com") || url.includes("wu.com")) &&
        (url.includes("fxc") || url.includes("price") || url.includes("quote"))
      ) {
        try {
          const json = await response.json();
          const payouts = json?.payoutAmounts ?? json?.payout_amounts ?? json?.data?.payoutAmounts;
          if (Array.isArray(payouts) && payouts[0]?.exchangeRate) {
            capturedRate = parseFloat(payouts[0].exchangeRate);
          }
          const fee = json?.charges ?? json?.fee ?? json?.data?.fee;
          if (fee) capturedFee = parseFloat(fee);
        } catch {}
      }
    });

    await page.goto(
      "https://www.westernunion.com/us/en/send-money/app/start?countryCode=IN",
      { waitUntil: "load", timeout: 30000 }
    );

    // Fallback: DOM
    if (!capturedRate) {
      const selectors = [
        '[data-testid="exchange-rate"]',
        ".exchange-rate",
        "[class*='exchangeRate']",
        "[class*='ExchangeRate']",
        "wu-exchange-rate",
      ];
      for (const sel of selectors) {
        const text = await page
          .locator(sel)
          .first()
          .textContent({ timeout: 3000 })
          .catch(() => null);
        if (text) {
          const match = text.match(/[\d,]+\.?\d*/);
          if (match) {
            capturedRate = parseFloat(match[0].replace(/,/g, ""));
            break;
          }
        }
      }
    }

    if (!capturedRate) throw new Error("Could not extract rate from Western Union");

    return {
      providerName: "Western Union",
      usd_inr_rate: capturedRate,
      fee_usd: capturedFee ?? 0,
      success: true,
    };
  } catch (err) {
    return {
      providerName: "Western Union",
      usd_inr_rate: 0,
      fee_usd: 0,
      success: false,
      error: String(err),
    };
  } finally {
    await context.close();
  }
}
