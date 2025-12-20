import { NextResponse } from "next/server";
import { embedText } from "@/lib/vectorClient";
import { supabase } from "@/lib/supabaseClient";
import pdf from "pdf-parse";

export const runtime = "nodejs";

function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const chunk = text.slice(start, start + size).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start += size - overlap;
  }

  return chunks;
}

async function extractText(file) {
  const name = file.name.toLowerCase();

  // TEXT FILES
  if (name.endsWith(".txt")) {
    return await file.text();
  }

  // PDF FILES (DO NOT TRUST MIME TYPE)
  if (name.endsWith(".pdf")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    return data.text || "";
  }

  return "";
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const files = form.getAll("files");

    let stored = 0;

    for (const file of files) {
      console.log("PROCESSING:", file.name, "TYPE:", file.type || "(empty)");

      const text = await extractText(file);

      if (!text || text.length < 100) {
        console.log("NO USABLE TEXT:", file.name);
        continue;
      }

      console.log("EXTRACTED LENGTH:", text.length);

      const chunks = chunkText(text);

      for (const chunk of chunks) {
        const embedding = await embedText(chunk);

        const { error } = await supabase
          .from("sales_training_vectors")
          .insert({
            content: chunk,
            embedding,
            source: file.name,
          });

        if (!error) stored++;
      }
    }

    return NextResponse.json({ ok: true, stored });

  } catch (err) {
    console.error("TRAINING ERROR:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
