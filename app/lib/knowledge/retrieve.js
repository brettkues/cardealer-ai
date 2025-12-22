import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;

// process-level caches (safe, non-persistent)
const embeddingCache = new Map();
const retrievalCache = new Map();

export async function retrieveKnowledge(message, domain = "sales") {
  console.log("🚨 LIVE RETRIEVE CALLED:", message);

  if (!DEALER_ID) {
    console.error("❌ Missing DEALER_ID");
    return [];
  }

  const normalized = message.toLowerCase().trim();
  const cacheKey = `${DEALER_ID}:${domain}:${normalized}`;

  // ===== FAST PATH: cached retrieval =====
  if (retrievalCache.has(cacheKey)) {
    return retrievalCache.get(cacheKey);
  }

  /* ===== 1️⃣ CREATE / REUSE EMBEDDING ===== */

  let queryEmbedding;

  if (embeddingCache.has(normalized)) {
    queryEmbedding = embeddingCache.get(normalized);
  } else {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });

    queryEmbedding = embeddingResponse.data[0].embedding;
    embeddingCache.set(normalized, queryEmbedding);
  }

  /* ===== 2️⃣ VECTOR SEARCH ===== */

  const { data: vectorData, error: vectorError } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.15, // was 0.01 (too permissive)
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
    retrievalCache.set(cacheKey, vectorResults);
    return vectorResults;
  }

  /* ===== 3️⃣ KEYWORD FALLBACK (LEGAL / DEFINITIONS) ===== */

  const keywords = normalized
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
      const results = keywordHits
        .map((r) => r.content)
        .filter(Boolean);

      retrievalCache.set(cacheKey, results);
      return results;
    }
  }

  console.log("❌ NO DEALER KNOWLEDGE FOUND");
  retrievalCache.set(cacheKey, []);
  return [];
}
