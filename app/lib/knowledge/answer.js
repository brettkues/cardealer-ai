import { retrieveKnowledge } from "./retrieve";

export async function buildAnswer({
  domain,
  userId,
  baseAnswer,
}) {
  const knowledge = await retrieveKnowledge({ domain, userId });

  let finalAnswer = baseAnswer;
  let sourceLabel = "General sales knowledge (not dealership policy)";

  // 1️⃣ Personal memory (highest priority for user tone)
  const personal = knowledge.find(
    k => k.authority === "personal" && k.scope === "user"
  );

  if (personal) {
    finalAnswer = `${baseAnswer}

(Keep in mind: ${personal.content})`;
    sourceLabel = "Personal preference applied";
    return { answer: finalAnswer, source: sourceLabel };
  }

  // 2️⃣ Dealership-approved guidance
  const approved = knowledge.find(k => k.authority === "approved");

  if (approved) {
    finalAnswer = `${baseAnswer}

— 
${approved.content}`;
    sourceLabel = "Dealership-approved guidance";
  }

  return { answer: finalAnswer, source: sourceLabel };
}
