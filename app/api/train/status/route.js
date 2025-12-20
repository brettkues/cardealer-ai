import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ingest_jobs")
      .select("id, original_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, jobs: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
