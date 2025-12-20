import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID; // you already set this

export async function retrieveKnowledge(message) {
  if (!DEALER_ID) {
    console.error("Missing DEALER_ID");
    return [];
  }

  // 1️⃣ Create query embedding
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // 2️⃣ Direct vector search (NO RPC)
  const { data, error } = await supabase
    .from("sales_training_vectors")
    .select("content")
    .eq("dealer_id", DEALER_ID)
    .order("embedding <-> cast(? as vector)", {
      ascending: true,
    })
    .limit(6)
    .bind(queryEmbedding);

  if (error) {
    console.error("Knowledge retrieval error:", error);
    return [];
  }

  return (data || [])
    .map(row => row.content)
    .filter(Boolean);
}
