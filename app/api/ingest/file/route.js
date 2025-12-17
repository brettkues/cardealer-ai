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
      return NextResponse.json(
        { error: "filename required" },
        { status: 400 }
      );
    }

    // 1. Download file from Supabase Storage
    const { data, error: downloadError } = await supabase
      .storage
      .from("TRAINING FILES")
      .download(filename);

    if (downloadError) {
      console.error("DOWNLOAD ERROR:", downloadError);
      return NextResponse.json(
        { error: "Storage download failed", details: downloadError },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No file data returned from storage" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // 2. Parse PDF
    const parsed = await pdf(buffer);
    const text = parsed.text;

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "Parsed text is empty or too small" },
        { status: 500 }
      );
    }

    // 3. Remove existing vectors for this file
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

      const { error: insertError } = await supabase
        .from("sales_training_vectors")
        .insert({
          content: chunk,
          embedding,
          source: filename,
          department
        });

      if (insertError) {
        console.error("INSERT ERROR:", insertError);
        return NextResponse.json(
          { error: "Vector insert failed", details: insertError },
          { status: 500 }
        );
      }

      stored++;
    }

    return NextResponse.json({
      ok: true,
      filename,
      department,
      chunksStored: stored
    });

  } catch (err) {
    console.error("INGEST FATAL ERROR:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
