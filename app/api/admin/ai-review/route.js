import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  let allRows = [];
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("sales_training_vectors")
      .select("source_file, created_at")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) break;

    allRows = allRows.concat(data);
    from += PAGE_SIZE;
  }

  const grouped = {};

  for (const row of allRows) {
    if (!grouped[row.source_file]) {
      grouped[row.source_file] = {
        source_file: row.source_file,
        chunk_count: 0,
        created_at: row.created_at,
      };
    }
    grouped[row.source_file].chunk_count++;
  }

  return NextResponse.json(
    Object.values(grouped).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  );
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
