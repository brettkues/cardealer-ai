import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;

const embeddingCache = new Map();
const retrievalCache = new Map();

export async function retrieveKnowledge(message, domain = "sales") {
  if (!DEALER_ID || !message) return null;

  const normalized = message.toLowerCase().trim();
  const cacheKey = `${DEALER_ID}:${domain}:${normalized}`;

  if (retrievalCache.has(cacheKey)) {
    return retrievalCache.get(cacheKey);
  }

  const isRateQuestion = /\b(rate|rates|term|months|72|84|96|gap|max gap|backend|advance|ltv|year|miles)\b/i.test(normalized);
  const stepMatch = message.match(/\[F&I STEP\s+(\d+)\]/i);
  const step = stepMatch ? stepMatch[1] : null;

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

  const rpcName = domain === "service"
    ? "match_service_training_vectors"
    : "match_sales_training_vectors";

  const { data, error } = await supabase.rpc(rpcName, {
  query_embedding: queryEmbedding,
  match_threshold: domain === "service" ? 0.1 : 0.2,
  match_count: 15,
  dealer_id_param: DEALER_ID,
});

  if (error || !data || data.length === 0) {
    retrievalCache.set(cacheKey, null);
    return null;
  }

  const newestRateSheets = {};
  const seenChunks = new Set();
  const cleanResults = [];

  for (const row of data) {
    const key = `${row.source_file}|${row.chunk_index}`;
    if (seenChunks.has(key)) continue;
    seenChunks.add(key);

    if (row.metadata?.doc_type === "RATE_SHEET") {
      const fkey = row.source_file;
      if (
        !newestRateSheets[fkey] ||
        new Date(row.created_at) > new Date(newestRateSheets[fkey].created_at)
      ) {
        newestRateSheets[fkey] = row;
      }
    } else {
      cleanResults.push(row);
    }
  }

  const final = [...Object.values(newestRateSheets), ...cleanResults];

  if (domain === "service") {
    if (!final.length) {
      retrievalCache.set(cacheKey, null);
      return null;
    }
    const serviceOnly = final.map(r => r.content);
    retrievalCache.set(cacheKey, serviceOnly);
    return serviceOnly;
  }

  if (domain === "fi" && isRateQuestion) {
    const rateHits = final.filter(r => r.metadata?.doc_type === "RATE_SHEET");
    if (rateHits.length) {
      const results = rateHits.map(r => r.content);
      retrievalCache.set(cacheKey, results);
      return results;
    }
  }

  if (domain === "fi" && step) {
    const stepHits = final.filter(r =>
      r.content?.includes(`[F&I STEP ${step}]`)
    );
    if (stepHits.length) {
      const results = stepHits.map(r => r.content);
      retrievalCache.set(cacheKey, results);
      return results;
    }
  }

  const general = final.map(r => r.content);
  if (!general.length) {
    retrievalCache.set(cacheKey, null);
    return null;
  }

  retrievalCache.set(cacheKey, general);
  return general;
}
