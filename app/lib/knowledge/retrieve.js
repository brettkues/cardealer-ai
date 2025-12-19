import { supabase } from "../supabaseClient";

export async function retrieveKnowledge({ domain, userId }) {
  const queries = [];

  // Personal (user-scoped)
  if (userId) {
    queries.push(
      supabase
        .from("knowledge")
        .select("*")
        .eq("domain", domain)
        .eq("scope", "user")
        .eq("authority", "personal")
        .eq("owner_user_id", userId)
        .eq("status", "active")
    );
  }

  // Global approved
  queries.push(
    supabase
      .from("knowledge")
      .select("*")
      .eq("domain", domain)
      .eq("scope", "global")
      .eq("authority", "approved")
      .eq("status", "active")
  );

  const results = await Promise.all(queries);
  return results.flatMap(r => r.data || []);
}
