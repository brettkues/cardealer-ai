import { NextResponse } from "next/server";
import { buildAnswer } from "../../lib/knowledge/answer";
import { detectTrainingIntent } from "../../lib/knowledge/intent";

// Simple base answer stub
async function getBaseAnswer(question) {
  return question;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const intent = detectTrainingIntent(body.message);

    // 🔒 TRAINING-ONLY COMMANDS — HANDLE FIRST
    if (
      intent === "forget" ||
      intent === "personal" ||
      intent === "add" ||
      intent === "replace" ||
      intent === "reference"
    ) {
      // fire training, but DO NOT answer
      try {
        await fetch("/api/knowledge/train", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        console.error("Training call failed:", e);
      }

      return NextResponse.json({
        answer: intent === "forget" ? "Personal note removed." : "Got it.",
        source: "System action",
      });
    }

    // 🔁 NORMAL QUESTIONS — TRAINING SIDE-EFFECT ONLY
    try {
      await fetch("/api/knowledge/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // silent
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
