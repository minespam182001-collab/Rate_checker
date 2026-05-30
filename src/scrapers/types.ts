export interface ScrapeResult {
  providerName: string;
  usd_inr_rate: number;
  fee_usd: number;
  success: boolean;
  is_estimated?: boolean; // true when rate is derived from mid-market + spread, not live
  error?: string;
}
