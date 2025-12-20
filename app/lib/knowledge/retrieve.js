import { supabase } from "@/lib/supabaseClient";

export async function retrieveKnowledge() {
  const { data, error } = await supabase
    .from("sales_training_vectors")
    .select("content")
    .limit(5);

  if (error) {
    console.error("Direct vector table read error:", error);
    return [];
  }

  return (data || []).map(row => row.content);
}
