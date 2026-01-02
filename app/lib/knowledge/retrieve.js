// app/lib/knowledge/retrieve.js
// FIX 1 — EXPLICIT NO-INTERNAL-SIGNAL

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
 * RETRIEVE KNOWLEDGE — PRODUCTION
 *
 * Returns:
 * - Array of strings → VALID dealer knowledge
 * - null → NO relevant dealer knowledge exists
 *
 * Guarantees:
 * - Dealer training searched first
 * - Rate sheets prioritized
 * - Only newest rate sheet per source_file returned
 * - No schema changes
 * - No writes
 */
export async function retrieveKnowledge(message, domain = "sales") {
  if (!DEALER_ID || !message) return null;

  const normalized = message.toLowerCase().trim();
  const cacheKey = `${DEALER_ID}:${domain}:${normalized}`;

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
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });
    queryEmbedding = res.data[0].embedding;
    embeddingCache.set(normalized, queryEmbedding);
  }

  /* ================= VECTOR SEARCH ================= */

  const rpcName =
    domain === "service"
      ? "match_service_training_vectors"
      : "match_sales_training_vectors";

  const { data, error } = await supabase.rpc(
    rpcName,
    {
      query_embedding: queryEmbedding,
      match_threshold:
  domain === "fi" ? 0.25 : 0.15,
      match_count: 10,
      dealer_id_param: DEALER_ID,
    }
  );

  if (error || !data || data.length === 0) {
    retrievalCache.set(cacheKey, null);
    return null;
  }

  /* ================= RATE SHEET DEDUPE ================= */

  const newestRateSheets = {};
  const nonRateRows = [];

  for (const row of data) {
    if (row.metadata?.doc_type === "RATE_SHEET") {
      const key = row.source_file;
      if (
        !newestRateSheets[key] ||
        new Date(row.created_at) > new Date(newestRateSheets[key].created_at)
      ) {
        newestRateSheets[key] = row;
      }
    } else {
      nonRateRows.push(row);
    }
  }

  const finalRows = [
    ...Object.values(newestRateSheets),
    ...nonRateRows,
  ];

  /* ================= PRIORITY ================= */

  if (isRateQuestion) {
    const rateHits = finalRows.filter(
      (r) => r.metadata?.doc_type === "RATE_SHEET"
    );
    if (rateHits.length) {
      const results = rateHits.map((r) => r.content);
      retrievalCache.set(cacheKey, results);
      return results;
    }
  }

  if (domain === "fi" && step) {
    const stepHits = finalRows.filter((r) =>
      r.content?.includes(`[F&I STEP ${step}]`)
    );
    if (stepHits.length) {
      const results = stepHits.map((r) => r.content);
      retrievalCache.set(cacheKey, results);
      return results;
    }
  }

  // General dealer knowledge
  const results = finalRows.map((r) => r.content);

  if (!results.length) {
    retrievalCache.set(cacheKey, null);
    return null;
  }

  retrievalCache.set(cacheKey, results);
  return results;
}
