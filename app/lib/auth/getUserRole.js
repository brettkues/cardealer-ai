import { supabase } from "@/lib/supabaseClient";

export async function getUserRole(userId) {
  if (!userId) return "sales";

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return data?.role || "sales";
}
