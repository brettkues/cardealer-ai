import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const DEALER_ID = process.env.DEALER_ID;
    if (!DEALER_ID) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // 1️⃣ Get allowed rate-sheet source files (newest only)
    const { data: rateRows, error: rateErr } = await supabase
      .from("latest_rate_sheets")
      .select("file_path");

    if (rateErr) throw rateErr;

    const allowedRateSources = new Set(
      (rateRows || []).map(r => r.file_path)
    );

    // 2️⃣ Pull all training vectors
    const { data, error } = await supabase
      .from("sales_training_vectors")
      .select("source_file, content, created_at")
      .eq("dealer_id", DEALER_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const grouped = {};

    for (const row of data) {
      const isChat = row.source_file.startsWith("chat:");
      const isRate = row.source_file.toLowerCase().includes("rate");

      // 🔒 filter old rate sheets
      if (isRate && !allowedRateSources.has(row.source_file)) continue;

      if (!grouped[row.source_file]) {
        grouped[row.source_file] = {
          source_file: row.source_file,
          created_at: row.created_at,
          chunks: 0,
          preview: "",
          is_chat: isChat,
        };
      }

      grouped[row.source_file].chunks++;

      if (!grouped[row.source_file].preview) {
        grouped[row.source_file].preview = row.content.slice(0, 300);
      }
    }

    return NextResponse.json({
      ok: true,
      items: Object.values(grouped),
    });

  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
