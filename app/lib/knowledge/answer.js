import { retrieveKnowledge } from "./retrieve";

export async function buildAnswer({ domain, userId, baseAnswer }) {
  const knowledge = await retrieveKnowledge(baseAnswer);

  // 🔍 HARD PROOF — SHOW LENGTH
  return {
    answer: `DEBUG:
baseAnswer = ${baseAnswer}

knowledge.length = ${knowledge?.length ?? "undefined"}

knowledge =
${JSON.stringify(knowledge, null, 2)}`,
    source: "DEBUG MODE",
  };
}
