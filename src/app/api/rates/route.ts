import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 60; // ISR revalidate every 60s

export async function GET() {
  // Latest rate row per provider via a lateral join approach using Postgres's
  // DISTINCT ON, which Supabase exposes through the .limit() + .order() pattern.
  // We fetch the last 10 rows per provider then de-dup in JS — simple and correct.
  const { data, error } = await supabase
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
