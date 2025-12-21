import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;

export async function retrieveKnowledge(message) {
  if (!DEALER_ID) {
    console.error("Missing DEALER_ID");
    return [];
  }

  // 1️⃣ Create embedding for the question
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // 2️⃣ Use RAW SQL via RPC-style query (this ACTUALLY WORKS)
  const { data, error } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 6,
      dealer_id_param: DEALER_ID,
    }
  );

  if (error) {
    console.error("Dealer brain vector error:", error);
    return [];
  }

  // PRIMARY: vector matches
const vectorResults = (data || [])
  .map(row => row.content)
  .filter(Boolean);

if (vectorResults.length > 0) {
  return vectorResults;
}

// FALLBACK: keyword search for statutory / definition text
const { data: keywordHits, error: keywordError } = await supabase
  .from("sales_training_vectors")
  .select("content")
  .ilike("content", `%${message.split(" ").slice(0, 4).join(" ")}%`)
  .limit(5);

if (keywordError) {
  console.error("Keyword fallback error:", keywordError);
  return [];
}

return (keywordHits || []).map(r => r.content).filter(Boolean);
return (data || [])
    .map(row => row.content)
    .filter(Boolean);
}
