import { Browser } from "playwright";

export interface TrustpilotResult {
  providerName: string;
  score: number | null;
  reviews: number | null;
}

const TRUSTPILOT_SLUGS: Record<string, string> = {
  Remitly: "remitly.com",
  Wise: "wise.com",
  "Western Union": "westernunion.com",
  Xoom: "xoom.com",
  "ICICI Money2India": "money2india.com",
};

export async function scrapeTrustpilot(
  browser: Browser,
  providerName: string
): Promise<TrustpilotResult> {
  const slug = TRUSTPILOT_SLUGS[providerName];
  if (!slug) return { providerName, score: null, reviews: null };

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    await page.goto(`https://www.trustpilot.com/review/${slug}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    // Trustpilot embeds structured data in a <script type="application/ld+json"> tag
    const ldJson = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);

    if (ldJson) {
      const data = JSON.parse(ldJson);
      const agg = data?.aggregateRating ?? data?.["@graph"]?.[0]?.aggregateRating;
      if (agg) {
        return {
          providerName,
          score: agg.ratingValue ? parseFloat(agg.ratingValue) : null,
          reviews: agg.reviewCount ? parseInt(agg.reviewCount, 10) : null,
        };
      }
    }

    // Fallback: DOM
    const scoreText = await page
      .locator('[data-rating-typography], [class*="ratingNumber"], .tp-rating')
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);

    const reviewText = await page
      .locator('[data-reviews-count-typography], [class*="reviewsCount"]')
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);

    return {
      providerName,
      score: scoreText ? parseFloat(scoreText.trim()) : null,
      reviews: reviewText ? parseInt(reviewText.replace(/[^\d]/g, ""), 10) : null,
    };
  } catch {
    return { providerName, score: null, reviews: null };
  } finally {
    await context.close();
  }
}
