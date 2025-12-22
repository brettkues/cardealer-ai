import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { data, error } = await supabase.rpc("sql", {
    query: `
      SELECT
        source_file,
        COUNT(*) AS chunk_count,
        MIN(created_at) AS created_at
      FROM sales_training_vectors
      GROUP BY source_file
      ORDER BY created_at DESC
    `
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req) {
  const { source_file } = await req.json();

  if (!source_file) {
    return NextResponse.json(
      { error: "source_file required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("sales_training_vectors")
    .delete()
    .eq("source_file", source_file);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
