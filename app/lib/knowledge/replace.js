import { insertKnowledgeRow, updateKnowledgeStatus } from "./db";
import { writeKnowledgeAudit } from "./audit";

export async function replaceKnowledge({
  oldKnowledgeIds = [],
  newKnowledgeParams,
  audit,
}) {
  if (oldKnowledgeIds.length > 0) {
    await updateKnowledgeStatus(oldKnowledgeIds, "replaced");
  }

  const newRecord = await insertKnowledgeRow({
    domain: newKnowledgeParams.domain,
    department: newKnowledgeParams.department ?? null,
    content: newKnowledgeParams.content,
    content_hash: newKnowledgeParams.contentHash,
    authority: newKnowledgeParams.authority,
    scope: newKnowledgeParams.scope,
    owner_user_id: newKnowledgeParams.ownerUserId ?? null,
    status: "active",
    added_by_user_id: newKnowledgeParams.addedByUserId,
  });

  await writeKnowledgeAudit({
    action: "replace",
    knowledgeId: newRecord.knowledge_id,
    userId: audit.userId,
    role: audit.role,
    domain: newRecord.domain,
  });

  return newRecord;
}
