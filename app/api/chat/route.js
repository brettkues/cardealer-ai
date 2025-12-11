import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "General chat assistant API." },
        { role: "user", content: message },
      ],
      max_tokens: 200,
    });

    const text = completion.choices?.[0]?.message?.content || "";

    return NextResponse.json({ response: text });
  } catch (err) {
    return NextResponse.json(
      { error: "Chat failed" },
      { status: 500 }
    );
  }
}
