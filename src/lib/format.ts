/** Format a number in Indian number system (lakhs/crores). */
export function formatINR(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return "—";
  // Indian locale uses 2 decimal places with lakh grouping
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format USD with comma grouping. */
export function formatUSD(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return "—";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** How long ago a timestamp was, as a human-readable string. */
export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** Effective INR received after fee, for a given send amount in USD. */
export function effectiveINR(sendUSD: number, rate: number, feeUSD: number): number {
  const netUSD = Math.max(0, sendUSD - feeUSD);
  return netUSD * rate;
}
