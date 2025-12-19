import { NextResponse } from "next/server";

// TEMP base answer stub
async function getBaseAnswer(question) {
  return `Base answer OK. Question was: ${question}`;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const baseAnswer = await getBaseAnswer(body.message);

    return NextResponse.json({
      answer: baseAnswer,
      source: "Base answer only",
    });
  } catch (err) {
    console.error("CHAT BASE ERROR:", err);

    return NextResponse.json(
      {
        answer: "Chat failed during base-answer test.",
        source: "Base error",
      },
      { status: 500 }
    );
  }
}
