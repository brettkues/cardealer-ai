import { supabase } from "../supabaseClient";

export async function writeKnowledgeAudit({
  action,
  knowledgeId = null,
  userId = null,
  role = null,
  domain = null,
}) {
  await supabase.from("knowledge_audit").insert({
    action,
    knowledge_id: knowledgeId,
    user_id: userId,
    role,
    domain,
  });
}
