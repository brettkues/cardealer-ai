import { NextResponse } from "next/server";
import { runChat } from "../../../../lib/ai/openai";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const reply = await runChat(
      "gpt-4o-mini",
      [
        { role: "system", content: "You are a helpful dealership assistant." },
        { role: "user", content: prompt }
      ]
    );

    return NextResponse.json(
      { reply },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Chat failure" },
      { status: 500 }
    );
  }
}
