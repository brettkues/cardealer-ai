import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEALER_ID = process.env.DEALER_ID;

async function getEmbedding(text) {
  const CHUNK_SIZE = 800;
  const chunks = [];

  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    const chunk = text.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 50) chunks.push(chunk);
  }

  const { data } = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunks,
  });

  return chunks.map((chunk, i) => ({
    content: chunk,
    embedding: data[i].embedding,
    chunk_index: i,
  }));
}

export async function POST(req) {
  try {
    const { content, source_file, domain = "sales" } = await req.json();
    if (!DEALER_ID || !content || !source_file) {
      return NextResponse.json({ ok: false, error: "Missing required input" }, { status: 400 });
    }

    const table =
      domain === "service" ? "service_training_vectors" : "sales_training_vectors";

    await supabase
      .from(table)
      .delete()
      .eq("dealer_id", DEALER_ID)
      .eq("source_file", source_file);

    const chunks = await getEmbedding(content);

    const payload = chunks.map((chunk) => ({
      dealer_id: DEALER_ID,
      source_file,
      ...chunk,
    }));

    const { error } = await supabase.from(table).insert(payload);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ SAVE TO BRAIN ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
