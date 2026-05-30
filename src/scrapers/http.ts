/**
 * HTTP-only scrapers — hit provider APIs directly without a browser.
 * These are the same endpoints their own web calculators call.
 * No Playwright needed; far less likely to be blocked.
 */

import { ScrapeResult } from "./types";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Wise ───────────────────────────────────────────────────────────────────
// Wise uses mid-market rate. Their public rates endpoint works without auth.
export async function httpWise(): Promise<ScrapeResult> {
  try {
    // Primary: public rates API
    const data = await fetchJSON(
      "https://api.wise.com/v1/rates?source=USD&target=INR"
    );
    const rate = Array.isArray(data) ? data[0]?.rate : data?.rate;
    if (rate && rate > 50) {
      return { providerName: "Wise", usd_inr_rate: parseFloat(rate), fee_usd: 2.30, success: true };
    }
    throw new Error("No rate in response");
  } catch (err) {
    // Fallback: scrape their compare page rate via their calculator API
    try {
      const data = await fetchJSON(
        "https://api.wise.com/v2/rates/history/live?source=USD&target=INR&length=1",
        { headers: { "Accept": "application/json" } }
      );
      const rate = data?.value ?? data?.rate ?? data?.[0]?.value;
      if (rate && rate > 50) {
        return { providerName: "Wise", usd_inr_rate: parseFloat(rate), fee_usd: 2.30, success: true };
      }
    } catch {}
    return { providerName: "Wise", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Remitly ────────────────────────────────────────────────────────────────
// Remitly's calculator calls their pricing estimate endpoint.
export async function httpRemitly(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://api.remitly.io/v2/calculator/estimate?anchor=SEND&sendAmount=1000&sendCurrency=USD&receiveCurrency=INR&deliveryMethod=BANK_DEPOSIT",
      {
        headers: {
          Origin: "https://www.remitly.com",
          Referer: "https://www.remitly.com/",
        },
      }
    );
    // Shape: { data: { exchange_rate, fee: { amount } } }
    const rate =
      data?.data?.exchange_rate ??
      data?.exchange_rate ??
      data?.rate;
    const fee =
      data?.data?.fee?.amount ??
      data?.fee?.amount ??
      data?.fee ??
      0;
    if (rate && rate > 50) {
      return {
        providerName: "Remitly",
        usd_inr_rate: parseFloat(rate),
        fee_usd: parseFloat(fee),
        success: true,
      };
    }
    throw new Error("No rate in Remitly response");
  } catch (err) {
    return { providerName: "Remitly", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Western Union ──────────────────────────────────────────────────────────
// WU exposes a public pricing endpoint used by their send page.
export async function httpWesternUnion(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://www.westernunion.com/wuconnect/rates/corridors?fromCurrencyCode=USD&toCurrencyCode=INR&fromCountryCode=US&toCountryCode=IN",
      {
        headers: {
          Origin: "https://www.westernunion.com",
          Referer: "https://www.westernunion.com/us/en/send-money/app/start",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.rate ??
      data?.corridors?.[0]?.exchangeRate ??
      data?.[0]?.exchangeRate;
    if (rate && rate > 50) {
      return { providerName: "Western Union", usd_inr_rate: parseFloat(rate), fee_usd: 0, success: true };
    }
    throw new Error("No rate in WU response");
  } catch (err) {
    return { providerName: "Western Union", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Xoom ───────────────────────────────────────────────────────────────────
// Xoom (PayPal) has a public transfer quote endpoint.
export async function httpXoom(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://www.xoom.com/service/transfer-quote?sendAmount=1000&sendCurrency=USD&receiveCurrency=INR&recipientCountryCode=IN&transferType=BANK_DEPOSIT",
      {
        headers: {
          Origin: "https://www.xoom.com",
          Referer: "https://www.xoom.com/india/sendmoney",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.exchange_rate ??
      data?.data?.exchangeRate ??
      data?.quote?.exchangeRate;
    const fee = data?.fee ?? data?.transferFee ?? data?.data?.fee ?? 0;
    if (rate && rate > 50) {
      return {
        providerName: "Xoom",
        usd_inr_rate: parseFloat(rate),
        fee_usd: parseFloat(fee),
        success: true,
      };
    }
    throw new Error("No rate in Xoom response");
  } catch (err) {
    return { providerName: "Xoom", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── ICICI Money2India ───────────────────────────────────────────────────────
export async function httpICICI(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://www.money2india.com/m2i/remittance/getExchangeRate?fromCurrencyCode=USD&toCurrencyCode=INR",
      {
        headers: {
          Origin: "https://www.money2india.com",
          Referer: "https://www.money2india.com/",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.rate ??
      data?.data?.exchangeRate ??
      data?.data?.rate;
    if (rate && rate > 50) {
      return { providerName: "ICICI Money2India", usd_inr_rate: parseFloat(rate), fee_usd: 0, success: true };
    }
    throw new Error("No rate in ICICI response");
  } catch (err) {
    return { providerName: "ICICI Money2India", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}

// ─── Taptap Send ────────────────────────────────────────────────────────────
export async function httpTaptap(): Promise<ScrapeResult> {
  try {
    const data = await fetchJSON(
      "https://api.taptapsend.com/api/transfer-quotes?sourceCurrency=USD&destinationCurrency=INR&sourceAmount=1000&destinationCountry=IN",
      {
        headers: {
          Origin: "https://www.taptapsend.com",
          Referer: "https://www.taptapsend.com/",
        },
      }
    );
    const rate =
      data?.exchangeRate ??
      data?.rate ??
      data?.data?.exchangeRate ??
      data?.quotes?.[0]?.exchangeRate;
    if (rate && rate > 50) {
      return { providerName: "Taptap Send", usd_inr_rate: parseFloat(rate), fee_usd: 0, success: true };
    }
    throw new Error("No rate in Taptap response");
  } catch (err) {
    return { providerName: "Taptap Send", usd_inr_rate: 0, fee_usd: 0, success: false, error: String(err) };
  }
}
