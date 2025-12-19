import { supabase } from "../supabaseClient";

export async function retrieveKnowledge({ domain, userId = null }) {
  let query = supabase
    .from("knowledge")
    .select("*")
    .eq("domain", domain)
    .eq("status", "active")
    .or("expires_at.is.null,expires_at.gt.now()");

  if (userId) {
    query = query.or(
      `scope.eq.global,scope.eq.user.and(owner_user_id.eq.${userId})`
    );
  } else {
    query = query.eq("scope", "global");
  }

  const { data, error } = await query
    .order("authority", { ascending: false })
    .order("added_at", { ascending: false });

  if (error) throw error;
  return data;
}
