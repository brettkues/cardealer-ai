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
  let filename;
  let department;

  try {
    const body = await req.json();
    filename = body.filePath || body.filename;
    department = body.department || "sales";

    if (!filename) {
      throw new Error("filename required");
    }

    const { data, error: downloadError } = await supabase
      .storage
      .from("TRAINING FILES")
      .download(filename);

    if (downloadError) throw downloadError;

    const buffer = Buffer.from(await data.arrayBuffer());
    const parsed = await pdf(buffer);
    const text = parsed.text;

    if (!text || text.length < 100) {
      throw new Error("Parsed text empty");
    }

    // remove old vectors
    await supabase
      .from("sales_training_vectors")
      .delete()
      .eq("source", filename)
      .eq("department", department);

    const chunks = chunkText(text);

    for (const chunk of chunks) {
      const embedding = await embedText(chunk);
      await supabase.from("sales_training_vectors").insert({
        content: chunk,
        embedding,
        source: filename,
        department
      });
    }

    // LOG SUCCESS
    await supabase.from("training_ingest_log").upsert({
      file_path: filename,
      department,
      status: "success"
    });

    return NextResponse.json({
      ok: true,
      filename,
      department,
      chunksStored: chunks.length
    });

  } catch (err) {
    // LOG FAILURE
    if (filename) {
      await supabase.from("training_ingest_log").upsert({
        file_path: filename,
        department,
        status: "failed"
      });
    }

    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
