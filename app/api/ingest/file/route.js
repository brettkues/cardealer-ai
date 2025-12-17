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
    const body = await req.json();
    const filename = body.filePath || body.filename;
    const department = body.department || "sales";

    if (!filename) {
      return NextResponse.json(
        { error: "filename required" },
        { status: 400 }
      );
    }

    const { data, error: downloadError } = await supabase
      .storage
      .from("TRAINING FILES")
      .download(filename);

    if (downloadError) {
      return NextResponse.json(
        { error: "Storage download failed", details: downloadError },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const parsed = await pdf(buffer);
    const text = parsed.text;

    if (!text || text.length < 100) {
      return NextResponse.json(
        { error: "Parsed text empty or too small" },
        { status: 500 }
      );
    }

    await supabase
      .from("sales_training_vectors")
      .delete()
      .eq("source", filename)
      .eq("department", department);

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
