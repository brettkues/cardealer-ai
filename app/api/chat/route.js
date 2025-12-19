import { NextResponse } from "next/server";
import { buildAnswer } from "../../lib/knowledge/answer";
import { detectTrainingIntent } from "../../lib/knowledge/intent";

// Simple base answer stub (safe)
async function getBaseAnswer(question) {
  return `Here’s a solid general answer:\n\n${question}`;
}

export async function POST(req) {
  try {
    const body = await req.json();

    // 🔁 Re-enable training (fire-and-forget, never blocks chat)
    try {
      await fetch("/api/knowledge/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      // intentionally silent
      console.error("Training call failed:", e);
    }

    const intent = detectTrainingIntent(body.message);

    // Short-circuit for training-only commands
    if (
      intent === "forget" ||
      intent === "personal" ||
      intent === "add" ||
      intent === "replace" ||
      intent === "reference"
    ) {
      return NextResponse.json({
        answer: intent === "forget" ? "Personal note removed." : "Got it.",
        source: "System action",
      });
    }

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
