import { supabase } from "@/lib/supabaseClient";

/**
 * Retrieve dealership training from vector table (sales_training_vectors)
 * This reconnects the dealer brain.
 */
export async function retrieveKnowledge(message, domain) {
  const { data, error } = await supabase
    .from("sales_training_vectors")
    .select("content")
    .order("id", { ascending: false })
    .limit(8);

  if (error) {
    console.error("retrieveKnowledge error:", error);
    return [];
  }

  return (data || [])
    .map((row) => row.content)
    .filter(Boolean);
}
