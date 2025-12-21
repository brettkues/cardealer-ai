import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;

export async function retrieveKnowledge(message, domain = "sales") {
  console.log("🚨 LIVE RETRIEVE CALLED:", message);

  if (!DEALER_ID) {
    console.error("❌ Missing DEALER_ID");
    return [];
  }

  /* ===== 1️⃣ CREATE EMBEDDING ===== */

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  /* ===== 2️⃣ VECTOR SEARCH ===== */

  const { data: vectorData, error: vectorError } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.01,
      match_count: 6,
      dealer_id_param: DEALER_ID,
    }
  );

  if (vectorError) {
    console.error("❌ Vector search error:", vectorError);
  }

  const vectorResults = (vectorData || [])
    .map((row) => row.content)
    .filter(Boolean);

  if (vectorResults.length > 0) {
    console.log("✅ VECTOR MATCH HIT");
    return vectorResults;
  }

  /* ===== 3️⃣ KEYWORD FALLBACK (LEGAL / DEFINITIONS) ===== */

  const keywords = message
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 4)
    .slice(0, 5);

  for (const word of keywords) {
    const { data: keywordHits, error: keywordError } = await supabase
      .from("sales_training_vectors")
      .select("content")
      .eq("dealer_id", DEALER_ID)
      .ilike("content", `%${word}%`)
      .limit(3);

    if (keywordError) {
      console.error("❌ Keyword fallback error:", keywordError);
      continue;
    }

    if (keywordHits && keywordHits.length > 0) {
      console.log("✅ KEYWORD FALLBACK HIT:", word);
      return keywordHits.map((r) => r.content).filter(Boolean);
    }
  }

  console.log("❌ NO DEALER KNOWLEDGE FOUND");
  return [];
}
