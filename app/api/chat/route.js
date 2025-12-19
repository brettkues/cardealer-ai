import { NextResponse } from "next/server";
import { buildAnswer } from "@/app/lib/knowledge/answer";

// NOTE: replace this stub with your real LLM call if it already exists
async function getBaseAnswer(question) {
  return question; // placeholder — keeps flow intact
}

export async function POST(req) {
  const body = await req.json();

  // side-effect: training capture
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/knowledge/train`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  } catch {}

  const baseAnswer = await getBaseAnswer(body.message);

  const { answer, source } = await buildAnswer({
    domain: body.domain || "sales",
    userId: body.user?.id || null,
    question: body.message,
    baseAnswer,
  });

  return NextResponse.json({
    answer,
    source,
  });
}
