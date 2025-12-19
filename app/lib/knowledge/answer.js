import { retrieveKnowledge } from "./retrieve";

export async function buildAnswer({ domain, userId, baseAnswer }) {
  const knowledge = await retrieveKnowledge({ domain, userId });

  // PERSONAL MEMORY (user-scoped)
  const personal = knowledge.find(
    k => k.authority === "personal" && k.scope === "user"
  );

  if (personal) {
    return {
      answer: `${baseAnswer}\n\n(Note: ${personal.content})`,
      source: "Personal preference applied",
    };
  }

  // DEALERSHIP POLICY
  const approved = knowledge.find(k => k.authority === "approved");

  if (approved) {
    return {
      answer: `${baseAnswer}\n\n${approved.content}`,
      source: "Dealership-approved guidance",
    };
  }

  return {
    answer: baseAnswer,
    source: "General sales knowledge (not dealership policy)",
  };
}
