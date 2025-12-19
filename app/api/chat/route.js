import { NextResponse } from "next/server";
import { buildAnswer } from "../../lib/knowledge/answer";
import { detectTrainingIntent } from "../../lib/knowledge/intent";

async function getBaseAnswer(question) {
  // TEMP: simple passthrough so chat always works
  return question;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const intent = detectTrainingIntent(body.message);

    // Fire-and-forget training
    try {
      await fetch("/api/knowledge/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("Training error:", e);
    }

    // Training-only commands short-circuit
    if (
      intent === "forget" ||
      intent === "personal" ||
      intent === "add" ||
      intent === "replace" ||
      intent === "reference"
    ) {
      return NextResponse.json({
        answer:
          intent === "forget"
            ? "Personal note removed."
            : "Got it.",
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
    console.error("CHAT ROUTE ERROR:", err);

    return NextResponse.json(
      {
        answer:
          "The assistant ran into a server error. Please try again.",
        source: "System error",
      },
      { status: 500 }
    );
  }
}
