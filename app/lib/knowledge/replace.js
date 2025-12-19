import { supabase } from "../supabaseClient";

export async function replaceKnowledge({
  domain,
  authority,
  scope,
  userId,
}) {
  if (!userId) return;

  await supabase
    .from("knowledge")
    .update({ status: "deleted" })
    .eq("domain", domain)
    .eq("authority", authority)
    .eq("scope", scope)
    .eq("owner_user_id", userId)
    .eq("status", "active");
}
