import { retrieveKnowledge } from "./retrieve";

export async function buildAnswer({
  domain,
  userId,
  baseAnswer,
}) {
  const knowledge = await retrieveKnowledge({ domain, userId });

  let sourceLabel = "General sales knowledge (not dealership policy)";
  let finalAnswer = baseAnswer;

  if (knowledge && knowledge.length > 0) {
    const approved = knowledge.find(k => k.authority === "approved");

    if (approved) {
      finalAnswer = `${baseAnswer}\n\n—\n${approved.content}`;
      sourceLabel = "Dealership-approved guidance";
    } else {
      sourceLabel = "Dealership guidance + general sales knowledge";
    }
  }

  return {
    answer: finalAnswer,
    source: sourceLabel,
  };
}
