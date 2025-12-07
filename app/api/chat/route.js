import { NextResponse } from "next/server";
import { runChat } from "@/lib/ai/openai";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages payload." },
        { status: 400 }
      );
    }

    const reply = await runChat("gpt-4o-mini", messages);

    return NextResponse.json({ response: reply });

  } catch (err) {
    return NextResponse.json(
      { error: "Chat request failed." },
      { status: 500 }
    );
  }
}
