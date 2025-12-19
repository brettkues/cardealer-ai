import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body?.message) {
      return NextResponse.json({
        answer: "No question received.",
        source: "System",
      });
    }

    // SIMPLE, GUARANTEED RESPONSE
    return NextResponse.json({
      answer: body.message,
      source: "General sales knowledge (not dealership policy)",
    });
  } catch (err) {
    return NextResponse.json(
      {
        answer: "Internal error. Chat route failed.",
        source: "System error",
      },
      { status: 500 }
    );
  }
}
