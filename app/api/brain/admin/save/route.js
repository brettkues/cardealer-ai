import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;
const CHUNK_SIZE = 800;

/* ------------------ helpers ------------------ */

function chunkText(text, size) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

/*
  IMPORTANT:
  source_file is the replacement key.
  It MUST be stable across versions (e.g. "ultra-rate-sheet").
  Do NOT derive this from content for versioned material.
*/
function makeSourceFile(label, content) {
  const slug = content
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .slice(0, 6)
    .join("-");
  return `${label}:${slug || "note"}`;
}

/* ------------------ handler ------------------ */

export async function POST(req) {
  try {
    const { content, role, source_file } = await req.json();

    if (role !== "admin" && role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!content || !DEALER_ID) {
      return NextResponse.json(
        { error: "Missing content or dealer id" },
        { status: 400 }
      );
    }

    const finalSource =
      source_file || makeSourceFile("admin-save", content);

    /* ======================================================
       HARD REPLACEMENT (SAFE)
       ------------------------------------------------------
       This deletes ONLY:
       - this dealer's data
       - for this exact source_file
       Nothing else can be touched.
    ====================================================== */

    const { error: deleteError } = await supabase
      .from("sales_training_vectors")
      .delete()
      .eq("dealer_id", DEALER_ID)
      .eq("source_file", finalSource);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    /* ------------------ embed + insert new version ------------------ */

    const chunks = chunkText(content, CHUNK_SIZE);

    const embeddings = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const rows = chunks.map((chunk, i) => ({
      dealer_id: DEALER_ID,
      source_file: finalSource,
      chunk_index: i,
      content: chunk,
      embedding: embeddings.data[i].embedding,
    }));

    const { error: insertError } = await supabase
      .from("sales_training_vectors")
      .insert(rows);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      replaced: true,
      source_file: finalSource,
      chunks: rows.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Save failed" },
      { status: 500 }
    );
  }
}
