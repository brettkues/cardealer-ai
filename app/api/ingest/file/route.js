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

    if (!filename) throw new Error("filename required");

    const { data, error } = await supabase
      .storage
      .from("TRAINING FILES")
      .download(filename);

    if (error) throw error;

    const buffer = Buffer.from(await data.arrayBuffer());
    const parsed = await pdf(buffer);
    const text = parsed?.text?.trim();

    // 🚫 SKIP non-text PDFs
    if (!text || text.length < 200) {
      await supabase.from("training_ingest_log").upsert({
        file_path: filename,
        department,
        status: "failed"
      });

      return NextResponse.json({
        skipped: true,
        reason: "non-text pdf",
        filename
      });
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
