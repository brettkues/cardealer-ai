import { supabase } from "../supabaseClient";

export async function writeKnowledgeAudit({
  action,
  knowledgeId = null,
  userId,
  role,
  domain = null,
}) {
  const { error } = await supabase
    .from("knowledge_audit")
    .insert({
      action,
      knowledge_id: knowledgeId,
      user_id: userId,
      role,
      domain,
    });

  if (error) throw error;
}
