import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("ingest_jobs")
      .select(
        `
        id,
        original_name,
        status,
        created_at,
        source
        `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      jobs: data,
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Failed to load ingestion status" },
      { status: 500 }
    );
  }
}
