import { insertKnowledgeRow } from "./db";
import { hashContent } from "./hash";
import { writeKnowledgeAudit } from "./audit";

export async function insertKnowledge(params) {
  const {
    domain,
    department = null,
    content,
    authority,
    scope,
    ownerUserId = null,
    addedByUserId,
    effectiveDate = null,
    expiresAt = null,
  } = params;

  const contentHash = hashContent(content);

  const record = await insertKnowledgeRow({
    domain,
    department,
    content,
    content_hash: contentHash,
    authority,
    scope,
    owner_user_id: ownerUserId,
    status: "active",
    effective_date: effectiveDate,
    expires_at: expiresAt,
    added_by_user_id: addedByUserId,
  });

  await writeKnowledgeAudit({
    action: "add",
    knowledgeId: record.knowledge_id,
    userId: addedByUserId,
    role: "system",
    domain,
  });

  return record;
}
