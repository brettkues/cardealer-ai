import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { department = "sales" } = await req.json();

    // get files already attempted
    const { data: attempted } = await supabase
      .from("training_ingest_log")
      .select("file_path")
      .eq("department", department);

    const attemptedSet = new Set(
      (attempted || []).map(r => r.file_path)
    );

    // get all storage files
    const { data: files, error } = await supabase
      .storage
      .from("TRAINING FILES")
      .list("", { limit: 1000 });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    // find first unattempted file
    const next = files.find(f => !attemptedSet.has(f.name));

    if (!next) {
      return NextResponse.json({
        ok: true,
        done: true
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `https://${req.headers.get("host")}`;

    // ingest exactly ONE file
    await fetch(`${baseUrl}/api/ingest/file`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filePath: next.name,
        department
      })
    });

    return NextResponse.json({
      ok: true,
      processed: next.name
    });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
