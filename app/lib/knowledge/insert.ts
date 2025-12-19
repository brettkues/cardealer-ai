import { db } from "@/app/lib/db";
import { hashContent } from "./hash";

type InsertKnowledgeParams = {
  domain: "sales" | "fi";
  department?: string | null;
  content: string;
  authority: "approved" | "reference" | "personal";
  scope: "global" | "user";
  ownerUserId?: string | null;
  addedByUserId: string;
  effectiveDate?: string | null;
  expiresAt?: string | null;
  replacesKnowledgeId?: string | null;
};

export async function insertKnowledge(params: InsertKnowledgeParams) {
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
    replacesKnowledgeId = null,
  } = params;

  const contentHash = hashContent(content);

  const result = await db.query(
    `
    INSERT INTO knowledge (
      domain,
      department,
      content,
      content_hash,
      authority,
      scope,
      owner_user_id,
      status,
      effective_date,
      expires_at,
      replaces_knowledge_id,
      added_by_user_id
    )
    VALUES (
      $1,$2,$3,$4,
      $5,$6,$7,
      'active',$8,$9,
      $10,$11
    )
    RETURNING *
    `,
    [
      domain,
      department,
      content,
      contentHash,
      authority,
      scope,
      ownerUserId,
      effectiveDate,
      expiresAt,
      replacesKnowledgeId,
      addedByUserId,
    ]
  );

  return result.rows[0];
}
