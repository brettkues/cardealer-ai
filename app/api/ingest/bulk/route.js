import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

async function listAllFiles(bucket) {
  let files = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .list("", { limit, offset });

    if (error) throw error;
    if (!data || data.length === 0) break;

    files = files.concat(data);
    offset += limit;
  }

  return files;
}

export async function POST(req) {
  try {
    const { department = "sales", limit = 20 } = await req.json();

    // files already attempted
    const { data: attempted } = await supabase
      .from("training_ingest_log")
      .select("file_path")
      .eq("department", department);

    const attemptedSet = new Set((attempted || []).map(r => r.file_path));

    // ✅ list ALL storage files (not just first 100)
    const files = await listAllFiles("TRAINING FILES");

    // filter unattempted
    const candidates = files.filter(f => !attemptedSet.has(f.name));

    const batch = candidates.slice(0, limit);
    const results = [];

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      `https://${req.headers.get("host")}`;

    for (const file of batch) {
      const res = await fetch(`${baseUrl}/api/ingest/file`, {
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
      remaining: candidates.length - batch.length
    });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
