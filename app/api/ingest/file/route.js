import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST() {
  const { data, error } = await supabase
    .storage
    .from("TRAINING FILES")
    .list("");

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    files: data.map(f => f.name)
  });
}
