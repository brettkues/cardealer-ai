import { NextResponse } from "next/server";
import { embedText } from "@/lib/vectorClient";
import { supabase } from "@/lib/supabaseClient";

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
    const form = await req.formData();
    const files = form.getAll("files");

    let stored = 0;

    for (const file of files) {
      const text = await file.text();
      const chunks = chunkText(text);

      for (const chunk of chunks) {
        const embedding = await embedText(chunk);

        const { error } = await supabase
          .from("sales_training_vectors")
          .insert({
            content: chunk,
            embedding,
            source: file.name
          });

        if (!error) stored++;
      }
    }

    return NextResponse.json({ ok: true, stored });

  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
