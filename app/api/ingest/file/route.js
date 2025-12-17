import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { embedText } from "@/lib/vectorClient";
import pdf from "pdf-parse";

export const runtime = "nodejs";

function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }

  return chunks;
}

export async function POST(req) {
  try {
    const { filename, department = "sales" } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: "filename required" }, { status: 400 });
    }

    // 1. Download file from Storage
    const { data, error } = await supabase
      .storage
      .from("TRAINING FILES")
      .download(filename);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // 2. Extract text (PDF)
    const parsed = await pdf(buffer);
    const text = parsed.text;

    // 3. Remove old vectors for this file
    await supabase
      .from("sales_training_vectors")
      .delete()
      .eq("source", filename)
      .eq("department", department);

    // 4. Chunk + embed + store
    const chunks = chunkText(text);
    let stored = 0;

    for (const chunk of chunks) {
      const embedding = await embedText(chunk);

      await supabase.from("sales_training_vectors").insert({
        content: chunk,
        embedding,
        source: filename,
        department
      });

      stored++;
    }

    return NextResponse.json({
      ok: true,
      filename,
      department,
      chunksStored: stored
    });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
