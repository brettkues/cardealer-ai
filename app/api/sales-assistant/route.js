import { NextResponse } from "next/server";
import OpenAI from "openai";
import salesSystemPrompt from "../_system/salesPrompt";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: salesSystemPrompt },
        ...messages
      ]
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error("SALES ASSISTANT ERROR:", err);
    return NextResponse.json(
      { reply: "Server error" },
      { status: 500 }
    );
  }
}
