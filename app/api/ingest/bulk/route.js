import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { department = "sales", limit = 20 } = await req.json();

    // 1. Get already-ingested files
    const { data: existing } = await supabase
      .from("sales_training_vectors")
      .select("source")
      .eq("department", department);

    const ingested = new Set(existing.map(r => r.source));

    // 2. List files in storage
    const { data: files, error } = await supabase
      .storage
      .from("TRAINING FILES")
      .list("", { limit: 1000 });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    // 3. Filter out already ingested + duplicates
    const seen = new Set();
    const candidates = files.filter(f => {
      const base = f.name.replace(/\s*\(\d+\)/, "");
      if (seen.has(base)) return false;
      if (ingested.has(f.name)) return false;
      seen.add(base);
      return true;
    });

    // 4. Take next batch
    const batch = candidates.slice(0, limit);
    const results = [];

    for (const file of batch) {
      const res = await fetch("/api/ingest/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: file.name,
          department
        })
      });

      results.push({ file: file.name, status: res.status });
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results
    });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
