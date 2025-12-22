import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;
const CHUNK_SIZE = 800; // characters

function chunkText(text, size) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

export async function POST(req) {
  try {
    const { content, source_file = "admin-search", role } = await req.json();

    if (role !== "admin" && role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!content || !DEALER_ID) {
      return NextResponse.json(
        { error: "Missing content or dealer id" },
        { status: 400 }
      );
    }

    const chunks = chunkText(content, CHUNK_SIZE);

    const embeddings = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });

    const rows = chunks.map((chunk, i) => ({
      dealer_id: DEALER_ID,
      source_file,
      chunk_index: i,
      content: chunk,
      embedding: embeddings.data[i].embedding,
    }));

    const { error } = await supabase
      .from("sales_training_vectors")
      .insert(rows);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, chunks: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Save failed" },
      { status: 500 }
    );
  }
}
