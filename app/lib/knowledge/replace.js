import { db } from "@/app/lib/db";
import { insertKnowledge } from "./insert";
import { writeKnowledgeAudit } from "./audit";

export async function replaceKnowledge({
  oldKnowledgeIds,
  newKnowledgeParams,
  audit,
}) {
  await db.transaction(async (trx) => {
    await trx.query(
      `
      UPDATE knowledge
      SET status = 'replaced'
      WHERE knowledge_id = ANY($1)
      `,
      [oldKnowledgeIds]
    );

    const newRecord = await insertKnowledge({
      ...newKnowledgeParams,
    });

    await writeKnowledgeAudit({
      action: "replace",
      knowledgeId: newRecord.knowledge_id,
      userId: audit.userId,
      role: audit.role,
      domain: newRecord.domain,
    });
  });
}
