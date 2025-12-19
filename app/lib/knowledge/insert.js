import { supabase } from "../supabaseClient";

export async function insertKnowledge({
  domain,
  content,
  authority,
  scope,
  ownerUserId = null,
  addedByUserId = null,
}) {
  const { data, error } = await supabase
    .from("knowledge")
    .insert({
      domain,
      content,
      authority,
      scope,
      owner_user_id: ownerUserId,
      added_by_user_id: addedByUserId,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
