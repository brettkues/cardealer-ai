import { NextResponse } from "next/server";
import { detectTrainingIntent } from "../../lib/knowledge/intent";
import { buildAnswer } from "../../lib/knowledge/answer";

export async function POST(req) {
  try {
    const body = await req.json();
    const intent = detectTrainingIntent(body.message);

    // TRAINING COMMANDS ONLY
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

    // NORMAL CHAT (NO TRAINING)
    const { answer, source } = await buildAnswer({
      domain: body.domain || "sales",
      userId: body.user?.id || null,
      baseAnswer: body.message,
    });

    return NextResponse.json({ answer, source });
  } catch (err) {
    return NextResponse.json(
      {
        answer: "Something went wrong. Please try again.",
        source: "System error",
      },
      { status: 500 }
    );
  }
}
