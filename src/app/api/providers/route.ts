import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // cache for 1 hour — trust scores change daily

export async function GET() {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
