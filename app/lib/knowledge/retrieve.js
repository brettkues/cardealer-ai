// app/lib/knowledge/retrieve.js

import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;

// process-level caches (safe, non-persistent)
const embeddingCache = new Map();
const retrievalCache = new Map();

/**
 * RETRIEVE KNOWLEDGE — PRODUCTION, UNIFIED
 *
 * Guarantees:
 * - Dealer training is ALWAYS searched first
 * - Rate sheets are prioritized for rate-related questions
 * - Superseded rate sheets are NEVER returned
 * - Falls back gracefully when no training exists
 * - No schema changes
 * - No re-ingestion
 * - No mutation
 */
export async function retrieveKnowledge(message, domain = "sales") {
  console.log("🚨 LIVE RETRIEVE CALLED:", message);

  if (!DEALER_ID || !message) {
    console.error("❌ Missing DEALER_ID or message");
    return [];
  }

  const normalized = message.toLowerCase().trim();
  const cacheKey = `${DEALER_ID}:${domain}:${normalized}`;

  /* ===== FAST PATH: cached retrieval ===== */
  if (retrievalCache.has(cacheKey)) {
    return retrievalCache.get(cacheKey);
  }

  /* ================= INTENT DETECTION ================= */

  const isRateQuestion =
    /\b(rate|rates|term|months|72|84|96|gap|max gap|backend|advance|ltv|year|miles)\b/i.test(
      normalized
    );

  const stepMatch = message.match(/\[F&I STEP\s+(\d+)\]/i);
  const step = stepMatch ? stepMatch[1] : null;

  /* ================= EMBEDDING ================= */

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

  /* ================= VECTOR SEARCH ================= */

  const { data: vectorData, error: vectorError } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.15,
      match_count: 8,
      dealer_id_param: DEALER_ID,
    }
  );

  if (vectorError) {
    console.error("❌ Vector search error:", vectorError);
  }

  let vectorResults = (vectorData || []).filter(Boolean);

  /* ================= POST-FILTERING ================= */

  if (vectorResults.length > 0) {
    // 1️⃣ Never return superseded rate sheets
    vectorResults = vectorResults.filter((row) => {
      if (row.metadata?.doc_type === "RATE_SHEET") {
        return row.metadata?.status !== "superseded";
      }
      return true;
    });

    // 2️⃣ Rate sheet priority
    if (isRateQuestion) {
      const rateSheets = vectorResults.filter(
        (r) => r.metadata?.doc_type === "RATE_SHEET"
      );

      if (rateSheets.length > 0) {
        const results = rateSheets.map((r) => r.content);
        retrievalCache.set(cacheKey, results);
        console.log("✅ RATE SHEET MATCH HIT");
        return results;
      }
    }

    // 3️⃣ Step bias (F&I)
    if (domain === "fi" && step) {
      const stepHits = vectorResults.filter((r) =>
        r.content?.includes(`[F&I STEP ${step}]`)
      );

      if (stepHits.length > 0) {
        const results = stepHits.map((r) => r.content);
        retrievalCache.set(cacheKey, results);
        console.log("✅ STEP-SPECIFIC HIT");
        return results;
      }
    }

    // 4️⃣ General dealer training fallback
    const results = vectorResults.map((r) => r.content);
    retrievalCache.set(cacheKey, results);
    console.log("✅ VECTOR MATCH HIT");
    return results;
  }

  /* ================= KEYWORD FALLBACK ================= */

  const keywords = normalized
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 4)
    .slice(0, 6);

  for (const word of keywords) {
    let query = supabase
      .from("sales_training_vectors")
      .select("content, metadata")
      .eq("dealer_id", DEALER_ID)
      .ilike("content", `%${word}%`)
      .limit(5);

    if (isRateQuestion) {
      query = query.contains("metadata", { doc_type: "RATE_SHEET" });
    }

    const { data: keywordHits, error } = await query;

    if (error) {
      console.error("❌ Keyword fallback error:", error);
      continue;
    }

    if (keywordHits && keywordHits.length > 0) {
      const filtered = keywordHits.filter((row) => {
        if (row.metadata?.doc_type === "RATE_SHEET") {
          return row.metadata?.status !== "superseded";
        }
        return true;
      });

      if (filtered.length > 0) {
        const results = filtered.map((r) => r.content);
        retrievalCache.set(cacheKey, results);
        console.log("✅ KEYWORD FALLBACK HIT:", word);
        return results;
      }
    }
  }

  /* ================= NOTHING FOUND ================= */

  console.log("❌ NO DEALER KNOWLEDGE FOUND");
  retrievalCache.set(cacheKey, []);
  return [];
}
