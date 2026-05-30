# CLAUDE.md — Remittance Rate Comparator (POC)

## Project summary

A single-page web app that scrapes live USD→INR exchange rates from major remittance providers, ranks them by effective value, and lets the user calculate exactly how much INR their family receives for a given USD amount. This is a private proof-of-concept — not a production launch.

Two assumptions being validated:
1. Playwright scraping works reliably against provider websites without being blocked.
2. Seeing the comparison causes users to switch providers.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Scraping | Playwright |
| Database | Supabase (Postgres) |
| Scheduler | Vercel Cron or GitHub Actions (every 15 min) |
| Deployment | Vercel |

---

## Data model

**`providers` table**
- `id` uuid PK
- `name` text
- `logo_url` text
- `trustpilot_score` float
- `trustpilot_reviews` integer
- `affiliate_url` text
- `trustpilot_updated_at` timestamp

**`rates` table**
- `id` uuid PK
- `provider_id` uuid FK → providers
- `usd_inr_rate` float
- `fee_usd` float
- `scraped_at` timestamp
- `is_stale` boolean (true when last scrape failed; serve previous cached value)

---

## API routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/rates` | Latest rate row per provider |
| GET | `/api/providers` | Provider metadata + trust scores |
| POST | `/api/scrape` | Internal — called by cron to refresh all rates |

---

## Providers (in priority order)

1. Remitly (P1 — must work)
2. Wise (P1 — must work)
3. Western Union (P1 — must work)
4. Xoom / PayPal (P2 — if scraping is feasible)
5. ICICI Money2India (P2 — if scraping is feasible)

At least 3 providers with live data is the minimum bar for POC success.

---

## Build phases

Work in this order — **do not write UI before the scraper is proven**:

1. **Phase 1 (days 1–2):** Playwright script fetching live rates for 3 providers, printing to console.
2. **Phase 2 (days 3–4):** Store rates in Supabase; cron running every 15 min.
3. **Phase 3 (days 5–7):** Next.js frontend — comparison table, amount calculator, trust scores, mobile-responsive.
4. **Phase 4 (days 8–9):** Sorting, timestamps, error states, deploy to Vercel.

Scraping is the highest-risk part. If it does not work, the rest is moot.

---

## Key functional rules

**Scraper**
- Runs every 15 minutes.
- If a scrape fails, keep the previous rate and set `is_stale = true`.
- Scraped rate must match what a human sees on the provider website within 0.01.

**Comparison table**
- Default sort: highest effective INR per USD first.
- Best-rate row is visually highlighted.
- Columns: provider logo, exchange rate, fee, effective rate for entered amount, Trustpilot score + count, "Send now" link.
- Show "last updated" timestamp per provider.

**Amount calculator**
- Pre-filled with $500 on load.
- Updates all rows instantly on input change (no submit button).
- USD formatted with commas; INR formatted in Indian number system (lakhs/crores).
- Handle invalid input (letters, negatives) gracefully — do not crash or show NaN.

**Trust scores**
- Scraped from Trustpilot once per day, not per rate refresh.
- If unavailable, show a dash — never break the layout.
- Data must be no more than 24 hours old.

---

## Non-functional constraints

- Page load < 2 seconds on 4G mobile.
- Rate data no older than 20 minutes during business hours.
- Target browsers: Chrome, Safari, Firefox (latest).
- **No user data stored** — no cookies, no analytics in the POC.
- If all provider scrapes fail at once, show a clear error state rather than serving stale data silently.
- Mobile-first layout; primary breakpoint is 375px.

---

## Out of scope for POC

Do not add: user accounts, login, alerts/notifications, historical charts, other currency pairs, user reviews, native apps, SEO pages, affiliate links.

---

## POC success criteria

Technical:
- Scraper runs uninterrupted 48 hours without manual intervention.
- Rate accuracy within 0.01 for 95%+ of checks.
- At least 3 providers with live data.

User:
- 5 target users complete the flow without a walkthrough.
- 3 of 5 say they would use this before their next transfer.
- 2 of 5 click "Send now" on a provider they had not originally planned to use.

---

## Open questions (to resolve during Phase 1)

1. Will Remitly and Western Union block Playwright? (Test immediately in Phase 1.)
2. Is the rate on the quote page the same as the rate at transfer completion?
3. Should the calculator default to $500 or prompt the user for their typical amount?
4. Do we need a disclaimer that we are not affiliated with any provider?
