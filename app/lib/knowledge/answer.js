import { retrieveKnowledge } from "./retrieve";

export async function buildAnswer({ domain, userId, baseAnswer }) {
  // Pull dealership knowledge ONLY
  const knowledge = await retrieveKnowledge(baseAnswer);

  // 🔒 VERIFICATION MODE — NO FALLBACK, NO GENERAL KNOWLEDGE
  if (!knowledge || knowledge.length === 0) {
    return {
      answer: "❌ NO DEALERSHIP TRAINING WAS RETRIEVED.",
      source: "Dealer brain (empty)",
    };
  }

  // If we get here, the dealer brain IS working
  return {
    answer: knowledge.join("\n\n"),
    source: "Dealership training (raw)",
  };
}
