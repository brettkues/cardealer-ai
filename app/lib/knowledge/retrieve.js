import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function retrieveKnowledge(message) {
  // 1) Embed the question
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // 2) RAW vector search (no threshold)
  const { data, error } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.0, // ← TEMP: return EVERYTHING
      match_count: 5,
    }
  );

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  // 3) Return content + similarity so we can SEE it
  return (data || []).map(row => ({
    content: row.content,
    similarity: row.similarity,
  }));
}
