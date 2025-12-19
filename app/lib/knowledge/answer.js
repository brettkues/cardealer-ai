import { retrieveKnowledge } from "./retrieve";

export async function buildAnswer({
  domain,
  userId,
  question,
  baseAnswer,
}) {
  const knowledge = await retrieveKnowledge({ domain, userId });

  let sourceLabel = "General sales knowledge (not dealership policy)";
  let anchoredAnswer = baseAnswer;

  if (knowledge && knowledge.length > 0) {
    const approved = knowledge.find(k => k.authority === "approved");

    if (approved) {
      anchoredAnswer = `${baseAnswer}\n\n—\n${approved.content}`;
      sourceLabel = "Dealership-approved guidance";
    } else {
      sourceLabel = "Dealership guidance + general sales knowledge";
    }
  }

  return {
    answer: anchoredAnswer,
    source: sourceLabel,
  };
}
