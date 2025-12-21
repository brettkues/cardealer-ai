import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * Admin-only
 * Lists what is currently stored in the AI brain
 * (grouped by source file)
 */

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("sales_training_vectors")
      .select("source_file, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // group by source_file
    const grouped = {};

    for (const row of data) {
      if (!grouped[row.source_file]) {
        grouped[row.source_file] = {
          source_file: row.source_file,
          count: 0,
          created_at: row.created_at,
        };
      }
      grouped[row.source_file].count++;
    }

    return NextResponse.json({
      ok: true,
      files: Object.values(grouped),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
