import { NextResponse } from "next/server";
import { buildAnswer } from "../../lib/knowledge/answer";
import { detectTrainingIntent } from "../../lib/knowledge/intent";

// NOTE: replace with your real LLM call later
async function getBaseAnswer(question) {
  return question;
}

export async function POST(req) {
  const body = await req.json();

  const intent = detectTrainingIntent(body.message);

  // ALWAYS send to training endpoint
  let trained = false;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/knowledge/train`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const json = await res.json();
    trained = json.trained === true;
  } catch {}

  // 🚫 SHORT-CIRCUIT FOR TRAINING-ONLY COMMANDS
  if (intent === "forget" || intent === "personal" || intent === "add" || intent === "replace" || intent === "reference") {
    return NextResponse.json({
      answer: intent === "forget"
        ? "Personal note removed."
        : "Got it.",
      source: "System action",
    });
  }

  // Normal answer flow
  const baseAnswer = await getBaseAnswer(body.message);

  const { answer, source } = await buildAnswer({
    domain: body.domain || "sales",
    userId: body.user?.id || null,
    baseAnswer,
  });

  return NextResponse.json({ answer, source });
}
