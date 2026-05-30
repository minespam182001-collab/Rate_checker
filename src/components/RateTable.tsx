"use client";

import { useState, useMemo } from "react";
import AmountInput from "./AmountInput";
import ProviderRow from "./ProviderRow";
import { effectiveINR } from "@/lib/format";
import type { RateWithProvider } from "@/lib/supabase";

interface Props {
  rates: RateWithProvider[];
}

export default function RateTable({ rates }: Props) {
  const [sendUSD, setSendUSD] = useState(500);

  const sorted = useMemo(() => {
    return [...rates].sort((a, b) => {
      const inrA = effectiveINR(sendUSD, a.usd_inr_rate, a.fee_usd);
      const inrB = effectiveINR(sendUSD, b.usd_inr_rate, b.fee_usd);
      return inrB - inrA;
    });
  }, [rates, sendUSD]);

  if (rates.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-700">
        <p className="font-semibold">No rate data available</p>
        <p className="text-sm mt-1">The scraper may not have run yet. Try again in a few minutes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calculator */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-slate-600 font-medium text-sm whitespace-nowrap">I want to send</p>
        <AmountInput value={sendUSD} onChange={setSendUSD} />
        <p className="text-slate-600 font-medium text-sm whitespace-nowrap">to India</p>
      </div>

      {/* Provider list */}
      <div className="space-y-4 mt-2">
        {sorted.map((entry, i) => (
          <ProviderRow
            key={entry.id}
            entry={entry}
            sendUSD={sendUSD}
            isBest={i === 0}
            rank={i + 1}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 text-center pt-2">
        Rates updated every 15 minutes. Effective rate shown after fees, before your bank&apos;s charges.
        We are not affiliated with any provider.
      </p>
    </div>
  );
}
