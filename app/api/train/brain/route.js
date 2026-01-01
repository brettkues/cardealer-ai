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
     * Pull ALL brain content.
     * RULES:
     * - Chat entries: always included
     * - Documents: always included
     * - Rate sheets: ONLY newest per lender
     */

    const { data, error } = await supabase
      .from("sales_training_vectors")
      .select(
        `
        source_file,
        content,
        created_at,
        doc_type,
        metadata
        `
      )
      .eq("dealer_id", DEALER_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const grouped = {};
    const latestRateByLender = {};

    for (const row of data) {
      const isChat = row.source_file.startsWith("chat:");
      const isRate = row.doc_type === "RATE_SHEET";
      const lender = row.metadata?.lender || null;

      // 🔒 RATE SHEET FILTER — newest per lender only
      if (isRate && lender) {
        if (latestRateByLender[lender]) {
          continue; // older rate sheet → ignored
        }
        latestRateByLender[lender] = row.source_file;
      }

      if (!grouped[row.source_file]) {
        grouped[row.source_file] = {
          source_file: row.source_file,
          created_at: row.created_at,
          chunks: 0,
          preview: "",
          step: null,
          is_chat: isChat,
          doc_type: row.doc_type || "DOCUMENT",
          lender,
        };
      }

      grouped[row.source_file].chunks += 1;

      // first chunk only → preview
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
    console.error("BRAIN LOAD ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load brain content" },
      { status: 500 }
    );
  }
}
