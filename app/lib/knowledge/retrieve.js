import { db } from "@/app/lib/db";

export async function retrieveKnowledge({
  domain,
  userId = null,
}) {
  const params = [domain];
  let userClause = "";

  if (userId) {
    params.push(userId);
    userClause = `
      OR (scope = 'user' AND owner_user_id = $2)
    `;
  }

  const result = await db.query(
    `
    SELECT *
    FROM knowledge
    WHERE
      domain = $1
      AND status = 'active'
      AND (
        scope = 'global'
        ${userClause}
      )
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY
      authority DESC,
      added_at DESC
    `,
    params
  );

  return result.rows;
}
