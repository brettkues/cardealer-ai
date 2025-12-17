import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { department = "sales", limit = 20 } = await req.json();

    // List files in bucket root
    const { data: files, error } = await supabase
      .storage
      .from("TRAINING FILES")
      .list("", { limit: 1000 });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    // Remove obvious duplicates (keep first copy)
    const seen = new Set();
    const uniqueFiles = files.filter(f => {
      const base = f.name.replace(/\s*\(\d+\)/, "");
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });

    // Limit batch size
    const batch = uniqueFiles.slice(0, limit);

    const results = [];

    for (const file of batch) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/ingest/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: file.name,
          department
        })
      });

      results.push({
        file: file.name,
        status: res.status
      });
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
