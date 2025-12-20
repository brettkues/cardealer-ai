import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function retrieveKnowledge(message) {
  // 1. Create embedding (MATCHES YOUR STORED VECTORS)
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const queryEmbedding = embedding.data[0].embedding;

  // 2. VECTOR SEARCH — DEALER BRAIN ONLY
  const { data, error } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.82,   // tighter = no internet junk
      match_count: 6,
    }
  );

  if (error) {
    console.error("Dealer brain vector error:", error);
    return [];
  }

  // 3. HARD FILTER — ONLY TRAINED CONTENT
  const results = (data || [])
    .map(r => r.content)
    .filter(Boolean);

  return results;
}
