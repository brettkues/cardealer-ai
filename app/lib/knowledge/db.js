import { supabase } from "../supabaseClient";

export async function insertKnowledgeRow(row) {
  const { data, error } = await supabase
    .from("knowledge")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKnowledgeStatus(ids, status) {
  const { error } = await supabase
    .from("knowledge")
    .update({ status })
    .in("knowledge_id", ids);

  if (error) throw error;
}
