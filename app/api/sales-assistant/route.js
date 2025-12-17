import { NextResponse } from "next/server";
import OpenAI from "openai";
import salesSystemPrompt from "../_system/salesPrompt";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body || !body.messages) {
      return NextResponse.json({ reply: "No messages received." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: salesSystemPrompt },
        ...body.messages
      ]
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    return NextResponse.json({
      error: String(err),
      stack: err?.stack || "no stack"
    }, { status: 500 });
  }
}
