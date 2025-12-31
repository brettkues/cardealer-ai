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
 * - Only the MOST RECENT rate sheet per filename is returned
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

  /* ===== FAST PATH ===== */
  if (retrievalCache.has(cacheKey)) {
    return retrievalCache.get(cacheKey);
  }

  /* ================= INTENT ================= */

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

  const { data: vectorData, error } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.15,
      match_count: 10,
      dealer_id_param: DEALER_ID,
    }
  );

  if (error) {
    console.error("❌ Vector search error:", error);
  }

  let rows = (vectorData || []).filter(Boolean);

  /* ================= RATE SHEET SUPPRESSION ================= */

  if (rows.length > 0) {
    const newestRateSheets = {};
    const finalRows = [];

    for (const row of rows) {
      if (row.metadata?.doc_type === "RATE_SHEET") {
        const key = row.source_file;
        if (
          !newestRateSheets[key] ||
          new Date(row.created_at) > new Date(newestRateSheets[key].created_at)
        ) {
          newestRateSheets[key] = row;
        }
      } else {
        finalRows.push(row);
      }
    }

    // keep only newest rate sheets
    finalRows.push(...Object.values(newestRateSheets));
    rows = finalRows;
  }

  /* ================= PRIORITY LOGIC ================= */

  if (rows.length > 0) {
    // Rate questions → rate sheets first
    if (isRateQuestion) {
      const rateHits = rows.filter(
        (r) => r.metadata?.doc_type === "RATE_SHEET"
      );

      if (rateHits.length > 0) {
        const results = rateHits.map((r) => r.content);
        retrievalCache.set(cacheKey, results);
        console.log("✅ RATE SHEET HIT");
        return results;
      }
    }

    // F&I step bias
    if (domain === "fi" && step) {
      const stepHits = rows.filter((r) =>
        r.content?.includes(`[F&I STEP ${step}]`)
      );

      if (stepHits.length > 0) {
        const results = stepHits.map((r) => r.content);
        retrievalCache.set(cacheKey, results);
        console.log("✅ STEP HIT");
        return results;
      }
    }

    // General dealer knowledge
    const results = rows.map((r) => r.content);
    retrievalCache.set(cacheKey, results);
    console.log("✅ VECTOR HIT");
    return results;
  }

  /* ================= KEYWORD FALLBACK ================= */

  const keywords = normalized
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 4)
    .slice(0, 6);

  for (const word of keywords) {
    const { data, error } = await supabase
      .from("sales_training_vectors")
      .select("content, metadata, source_file, created_at")
      .eq("dealer_id", DEALER_ID)
      .ilike("content", `%${word}%`)
      .limit(10);

    if (error) continue;

    if (data?.length) {
      const newestRateSheets = {};
      const results = [];

      for (const row of data) {
        if (row.metadata?.doc_type === "RATE_SHEET") {
          const key = row.source_file;
          if (
            !newestRateSheets[key] ||
            new Date(row.created_at) >
              new Date(newestRateSheets[key].created_at)
          ) {
            newestRateSheets[key] = row;
          }
        } else {
          results.push(row.content);
        }
      }

      results.push(...Object.values(newestRateSheets).map((r) => r.content));

      if (results.length > 0) {
        retrievalCache.set(cacheKey, results);
        console.log("✅ KEYWORD FALLBACK HIT:", word);
        return results;
      }
    }
  }

  /* ================= NOTHING FOUND ================= */

  retrievalCache.set(cacheKey, []);
  console.log("❌ NO DEALER KNOWLEDGE FOUND");
  return [];
}
