import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

/**
 * DELETE a source from the AI brain
 * - Removes all chunks for a given source_file
 * - Admin-only endpoint (UI already restricted)
 */

export async function POST(req) {
  try {
    const { source_file } = await req.json();

    if (!source_file) {
      return NextResponse.json(
        { ok: false, error: "source_file required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("sales_training_vectors")
      .delete()
      .eq("source_file", source_file);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      deleted: source_file,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
