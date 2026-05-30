import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from("rates")
    .select("*, provider:providers(*)")
    .order("scraped_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // De-dup: keep only the most recent row per provider
  const seen = new Set<string>();
  const latest = (data ?? []).filter((row) => {
    if (seen.has(row.provider_id)) return false;
    seen.add(row.provider_id);
    return true;
  });

  return NextResponse.json(latest);
}
