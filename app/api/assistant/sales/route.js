import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "No message provided." },
        { status: 400 }
      );
    }

    // Temporary placeholder response
    return NextResponse.json({
      reply: `You said: ${message}`
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Assistant error" },
      { status: 500 }
    );
  }
}
