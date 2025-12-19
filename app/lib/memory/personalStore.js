import { supabase } from "../supabaseClient";

export async function setPersonalMemory(userId, content) {
  if (!userId) return;

  await supabase
    .from("personal_memory")
    .upsert(
      { user_id: userId, content, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
}

export async function getPersonalMemory(userId) {
  if (!userId) return null;

  const { data } = await supabase
    .from("personal_memory")
    .select("content")
    .eq("user_id", userId)
    .single();

  return data?.content || null;
}

export async function clearPersonalMemory(userId) {
  if (!userId) return;

  await supabase
    .from("personal_memory")
    .delete()
    .eq("user_id", userId);
}
