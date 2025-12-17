import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: messages.map(m => ({
        role: m.role,
        content: [{ type: "text", text: m.content }]
      }))
    });

    return NextResponse.json({
      reply: response.output_text
    });

  } catch (err) {
    return NextResponse.json(
      { reply: String(err) },
      { status: 500 }
    );
  }
}
