export interface ScrapeResult {
  providerName: string;
  usd_inr_rate: number;
  fee_usd: number;
  success: boolean;
  error?: string;
}
