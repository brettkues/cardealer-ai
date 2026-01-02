import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { filePath, original_name } = await req.json();
  if (!filePath || !original_name) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { error } = await supabase.from("ingest_jobs").insert({
    file_path: filePath,
    original_name,
    source: "sales",
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
