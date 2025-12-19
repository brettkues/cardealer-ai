import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    return NextResponse.json({
      answer: `Echo test OK. You asked: "${body.message}"`,
      source: "Isolation test",
    });
  } catch (err) {
    console.error("CHAT ISOLATION ERROR:", err);

    return NextResponse.json(
      {
        answer: "Chat route crashed during isolation test.",
        source: "Isolation error",
      },
      { status: 500 }
    );
  }
}
