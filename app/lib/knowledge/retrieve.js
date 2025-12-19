import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function retrieveKnowledge(message, domain = "sales") {
  // 1) Embed the question
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // 2) Vector similarity search
  const { data, error } = await supabase.rpc(
    "match_sales_training_vectors",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: 5,
    }
  );

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  // 3) Return only relevant training text
  return (data || [])
    .map((row) => row.content)
    .filter(Boolean);
}
