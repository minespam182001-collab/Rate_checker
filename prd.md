# Product Requirements Document
# Remittance Rate Comparator — Proof of Concept

| Field | Value |
|---|---|
| Version | 0.1 — POC |
| Status | Draft |
| Currency pair | USD → INR only |
| Target | 2 weeks from kick-off |

---

## 1. Overview

### 1.1 Problem statement

Sending money from the US to India means choosing between 6–10 remittance providers. Each quotes a different exchange rate and charges different fees. Users currently open multiple browser tabs, manually note rates, and do their own math — a slow, error-prone process that often results in a suboptimal choice.

### 1.2 Proposed solution

A single web page that automatically fetches the live USD→INR rate from the most popular remittance providers, displays them ranked by effective value, and shows each provider's trust score — so users can make an informed decision in under 30 seconds.

### 1.3 POC goal

Validate two assumptions before building a full product:

1. **Scraping works reliably** — we can programmatically extract accurate live rates from provider websites without being blocked.
2. **Users find value** — when shown the comparison, real users change which provider they intended to use.

> This is NOT a production launch. It is a private, working prototype used to test these two assumptions.

---

## 2. Target users

**Primary user:** Indian diaspora living in the US

- Sends money home 1–2 times per month
- Typical transfer amount: $200–$2,000
- Uses mobile phone as primary device
- Cares about the INR amount received, not just the rate percentage

**The three questions they need answered:**

1. How much INR will my family actually receive if I send $X today?
2. Which provider gives the best deal right now?
3. Can I trust this provider — are other Indians using it?

---

## 3. POC scope

### 3.1 In scope

| Feature | Priority | POC | Notes |
|---|---|---|---|
| Live rate table | P0 | Yes | Core of the product |
| Amount calculator | P0 | Yes | Makes rates tangible |
| Provider trust score | P0 | Yes | Static, scraped daily |
| Last-updated timestamp | P1 | Yes | Builds rate trust |
| Transfer fee display | P1 | Yes | Completes cost picture |
| Sort by best rate | P1 | Yes | Saves user decision time |
| Mobile responsive UI | P1 | Yes | Primary user device |

### 3.2 Explicitly out of scope

- User accounts, login, or saved preferences
- Email/SMS price alerts or notifications
- Historical rate charts or trends
- Multiple currency pairs (GBP→INR, EUR→INR, etc.)
- User-submitted reviews or ratings
- Native mobile app (iOS or Android)
- SEO, marketing pages, or blog content
- Affiliate link integration

---

## 4. Providers to cover

Start with these 5. They cover 80%+ of USD→INR remittance volume.

| Provider | Tier | Priority | Notes |
|---|---|---|---|
| Remitly | 1 | High | Largest volume, well-known brand |
| Wise | 1 | High | Transparent fee model, tech-savvy users |
| Western Union | 1 | High | Legacy trust, large user base |
| Xoom (PayPal) | 2 | If scrape works | PayPal integration popular |
| ICICI Money2India | 2 | If scrape works | Popular with Indian banks |

---

## 5. Functional requirements

### FR-01: Rate scraper

**What it does**
A backend job runs every 15 minutes. It opens each provider's quote page, extracts the USD→INR rate, and stores it in the database with a timestamp.

**Acceptance criteria**
- Rate is successfully fetched from at least 3 providers
- Stored value matches what a human sees on the provider's website (within 0.01)
- If a scrape fails, the previous cached rate is kept and marked as stale
- Scraper runs on a schedule without manual intervention

---

### FR-02: Comparison table

**What it does**
The main page displays a table with one row per provider, sorted by best effective rate (highest INR per USD) by default.

**Columns to display**
- Provider name and logo
- Exchange rate (e.g. `1 USD = 84.23 INR`)
- Transfer fee (e.g. `$2.99`)
- Effective rate after fee for the user's entered amount
- Trust score (Trustpilot stars + review count)
- "Send now" button linking to provider website

**Acceptance criteria**
- Table renders correctly on mobile (375px) and desktop
- Best rate row is visually highlighted
- "Last updated" time shown per provider

---

### FR-03: Amount calculator

**What it does**
A text input above the table lets the user type an amount in USD. All rows update in real time to show how much INR each provider would deliver.

**Acceptance criteria**
- Input pre-filled with `$500` on page load
- Changing the value instantly updates all rows (no submit button)
- Numbers formatted correctly (commas for USD, Indian number system for INR)
- Invalid input (letters, negative numbers) handled gracefully

---

### FR-04: Provider trust score

**What it does**
Each provider row displays its Trustpilot rating and approximate review count. Scraped once per day, not per rate refresh.

**Acceptance criteria**
- Star rating and review count visible for each provider
- Data no more than 24 hours old
- If Trustpilot data is unavailable, cell shows a dash rather than breaking the layout

---

## 6. Non-functional requirements

- Page load time under 2 seconds on a 4G mobile connection
- Rate data no older than 20 minutes during business hours
- Works on Chrome, Safari, and Firefox (latest versions)
- No user data stored — no cookies, no analytics in POC
- If all provider scrapes fail simultaneously, show a clear error rather than stale data

---

## 7. Technical architecture

### 7.1 Tech stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js (React) | Fast to build, includes API routes, deploys to Vercel for free |
| Scraping | Playwright | Handles JavaScript-rendered pages that simpler HTTP clients cannot |
| Database | Supabase (Postgres) | Free tier, instant setup, good dashboard for inspecting scraped data |
| Scheduler | Vercel Cron or GitHub Actions | Triggers the scrape job every 15 minutes, no extra infrastructure needed |
| Deployment | Vercel | Zero-config deploy from GitHub, free tier covers POC traffic |

### 7.2 Data model

**Table: `providers`**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | e.g. Remitly |
| logo_url | text | |
| trustpilot_score | float | |
| trustpilot_reviews | integer | |
| affiliate_url | text | |
| trustpilot_updated_at | timestamp | |

**Table: `rates`**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| provider_id | uuid | Foreign key → providers |
| usd_inr_rate | float | Raw exchange rate |
| fee_usd | float | Flat transfer fee |
| scraped_at | timestamp | |
| is_stale | boolean | True if last scrape failed |

### 7.3 API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rates` | Returns latest rate row per provider |
| GET | `/api/providers` | Returns provider metadata and trust scores |
| POST | `/api/scrape` | Internal — called by cron job to refresh all rates |

---

## 8. Build plan

| Phase | Days | Goal | Deliverable |
|---|---|---|---|
| 1 | 1–2 | Working scraper | Playwright script fetching live rates for 3 providers, printing to console |
| 2 | 3–4 | Database + scheduler | Rates stored in Supabase, cron running every 15 min automatically |
| 3 | 5–7 | Frontend | Next.js table, amount calculator, trust scores, mobile responsive |
| 4 | 8–9 | Polish + deploy | Sorting, timestamps, error states, live on Vercel with real domain |

> **Start with Phase 1 before writing any UI code.** Scraping is the highest-risk part — if it does not work reliably, the rest of the product does not matter.

---

## 9. POC success criteria

The POC is considered successful when all three of the following are true.

### 9.1 Technical validation

- Scraper runs uninterrupted for 48 hours without manual intervention
- Rate accuracy verified: scraped rate matches provider website within 0.01 for 95%+ of checks
- At least 3 providers covered with live data

### 9.2 User validation

- 5 target users (Indian diaspora in the US) use the site without a walkthrough
- At least 3 of 5 say they would use this before their next transfer
- At least 2 users click "Send now" on a provider they had not originally planned to use — indicating the comparison changed their decision

### 9.3 If POC fails

| Failure | Pivot |
|---|---|
| Scraping blocked by all major providers | Switch to a third-party exchange rate API (rates less accurate but functional) |
| Users show no behavior change | Revisit UI layout and data surfaced before proceeding to MVP |

---

## 10. Open questions

1. Will Remitly and Western Union actively block Playwright scraping? *(Test in Phase 1)*
2. Is the rate shown on the provider quote page the same as the rate at transfer completion? *(Validate manually)*
3. Should the calculator default to $500 or ask the user their typical send amount?
4. Do we need a disclaimer stating we are not affiliated with any provider?

---

*This document covers the POC only. Requirements will be revisited and expanded before MVP development begins.*