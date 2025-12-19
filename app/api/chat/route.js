import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    return NextResponse.json({
      answer: `ANSWER OK: ${body.message}`,
      source: "Echo test",
    });
  } catch (e) {
    return NextResponse.json(
      {
        answer: "CHAT ROUTE CRASHED",
        source: "Hard failure",
      },
      { status: 500 }
    );
  }
}
