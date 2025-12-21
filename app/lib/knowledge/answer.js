import { retrieveKnowledge } from "./retrieve";

export async function buildAnswer({ domain, userId, baseAnswer }) {
  const knowledge = await retrieveKnowledge(baseAnswer);

  // ✅ DEALERSHIP TRAINING FOUND
  if (knowledge && knowledge.length > 0) {
    return {
      answer: knowledge.join("\n\n"),
      source: "Dealership training (internal)",
    };
  }

  // ⚠️ FALLBACK — GENERAL / INTERNET KNOWLEDGE
  return {
    answer: baseAnswer,
    source: "General knowledge (verify before use)",
  };
}
