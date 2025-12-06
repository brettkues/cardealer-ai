import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful dealership assistant." },
        { role: "user", content: prompt }
      ]
    });

    return NextResponse.json(
      { reply: completion.choices[0].message.content },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Chat failure" },
      { status: 500 }
    );
  }
}
