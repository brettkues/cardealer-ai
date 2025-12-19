import { NextResponse } from "next/server";
import { buildAnswer } from "../../lib/knowledge/answer";
import { detectTrainingIntent } from "../../lib/knowledge/intent";

async function getBaseAnswer(question) {
  return question;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const intent = detectTrainingIntent(body.message);

    // ✅ TRAINING COMMANDS ONLY
    if (intent) {
      await fetch("/api/knowledge/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      return NextResponse.json({
        answer: intent === "forget" ? "Personal note removed." : "Got it.",
        source: "System action",
      });
    }

    // ✅ NORMAL CHAT — NO TRAINING SIDE EFFECTS
    const baseAnswer = await getBaseAnswer(body.message);

    const { answer, source } = await buildAnswer({
      domain: body.domain || "sales",
      userId: body.user?.id || null,
      baseAnswer,
    });

    return NextResponse.json({ answer, source });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return NextResponse.json(
      {
        answer: "The assistant hit an internal error. Please try again.",
        source: "System error",
      },
      { status: 500 }
    );
  }
}
