import { db } from "../db";

export async function writeKnowledgeAudit({
  action,
  knowledgeId = null,
  userId,
  role,
  domain = null,
}) {
  await db.query(
    `
    INSERT INTO knowledge_audit
      (action, knowledge_id, user_id, role, domain)
    VALUES
      ($1, $2, $3, $4, $5)
    `,
    [action, knowledgeId, userId, role, domain]
  );
}
