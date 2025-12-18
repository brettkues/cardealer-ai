import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import pdf from "pdf-parse";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { data, error } = await supabase
      .storage
      .from("TRAINING FILES")
      .download("a-reg M.pdf");

    if (error) throw error;

    const buffer = Buffer.from(await data.arrayBuffer());
    const parsed = await pdf(buffer);

    return NextResponse.json({
      ok: true,
      textLength: parsed.text.length
    });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
