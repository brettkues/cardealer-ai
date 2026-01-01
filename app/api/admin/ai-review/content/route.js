import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET FULL TRAINING CONTENT FOR ONE SOURCE_FILE
export async function POST(req) {
  const { source_file } = await req.json();

  if (!source_file) {
    return NextResponse.json(
      { error: "source_file required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sales_training_vectors")
    .select("content, created_at")
    .eq("source_file", source_file)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Combine chunks into one readable block
  const fullText = data
    .map((row) => row.content)
    .filter(Boolean)
    .join("\n\n");

  return NextResponse.json({
    source_file,
    content: fullText,
    chunk_count: data.length,
  });
}
