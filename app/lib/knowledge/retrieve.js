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
      match_threshold: 0.75,
      match_count: 6,
      dealer_id_param: DEALER_ID,
    }
  );

  if (error) {
    console.error("Dealer brain vector error:", error);
    return [];
  }

  return (data || [])
    .map(row => row.content)
    .filter(Boolean);
}
