import { NextResponse } from "next/server";
import { buildAnswer } from "../../lib/knowledge/answer";

// Still no training. No internal fetch. No Supabase writes.

async function getBaseAnswer(question) {
  return `Base answer OK. Question was: ${question}`;
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
    console.error("CHAT BUILDANSWER ERROR:", err);

    return NextResponse.json(
      {
        answer: "Chat failed while building answer.",
        source: "BuildAnswer error",
      },
      { status: 500 }
    );
  }
}
