import { NextResponse } from "next/server";
import { buildAnswer } from "../../lib/knowledge/answer";

// Simple base answer stub (safe)
async function getBaseAnswer(question) {
  return `Here’s a solid general answer:\n\n${question}`;
}

export async function POST(req) {
  try {
    const body = await req.json();

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
