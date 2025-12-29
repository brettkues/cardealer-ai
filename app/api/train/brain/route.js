// app/api/train/brain/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const DEALER_ID = process.env.DEALER_ID;

    if (!DEALER_ID) {
      return NextResponse.json(
        { ok: false, error: "Missing dealer context" },
        { status: 500 }
      );
    }

    /**
     * Pull ALL brain content, grouped by source_file.
     * This includes:
     * - PDFs / uploads
     * - Chat-authored ADD TO BRAIN entries
     *
     * We do NOT reprocess embeddings.
     * We do NOT mutate data.
     */
    const { data, error } = await supabase
      .from("sales_training_vectors")
      .select(
        `
        source_file,
        content,
        created_at
        `
      )
      .eq("dealer_id", DEALER_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const grouped = {};

    for (const row of data) {
      if (!grouped[row.source_file]) {
        grouped[row.source_file] = {
          source_file: row.source_file,
          created_at: row.created_at,
          chunks: 0,
          preview: "",
          step: null,
          is_chat: row.source_file.startsWith("chat:"),
        };
      }

      grouped[row.source_file].chunks += 1;

      // First chunk only → preview
      if (!grouped[row.source_file].preview) {
        grouped[row.source_file].preview = row.content.slice(0, 300);

        const stepMatch = row.content.match(/\[F&I STEP\s+(\d+)\]/i);
        if (stepMatch) {
          grouped[row.source_file].step = stepMatch[1];
        }
      }
    }

    return NextResponse.json({
      ok: true,
      items: Object.values(grouped),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "Failed to load brain content" },
      { status: 500 }
    );
  }
}
