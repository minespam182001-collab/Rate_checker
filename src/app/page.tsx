import RateTable from "@/components/RateTable";
import { supabaseAdmin, type RateWithProvider } from "@/lib/supabase";

// Always render fresh — this is a live rate comparator, stale HTML is useless
export const dynamic = "force-dynamic";

async function getRates(): Promise<RateWithProvider[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("rates")
      .select("*, provider:providers(*)")
      .order("scraped_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];

    // De-dup: keep only the most recent row per provider
    const seen = new Set<string>();
    return data.filter((row) => {
      if (seen.has(row.provider_id)) return false;
      seen.add(row.provider_id);
      return true;
    }) as RateWithProvider[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const rates = await getRates();

  const allStale = rates.length > 0 && rates.every((r) => r.is_stale);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">USD → INR</h1>
            <p className="text-slate-500 text-sm">Best remittance rates, live</p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-3 py-1 font-medium">
            POC
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* All-stale error banner */}
        {allStale && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm font-medium">
            All provider rates are currently stale. Live data temporarily unavailable — figures shown are from the last successful scrape.
          </div>
        )}

        {/* Hero text */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
            How much INR will your family receive?
          </h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Compare live rates from the top 5 USD→INR providers. Sorted by best effective rate.
          </p>
        </div>

        {/* Rate comparison table + calculator */}
        <RateTable rates={rates} />
      </div>
    </main>
  );
}
