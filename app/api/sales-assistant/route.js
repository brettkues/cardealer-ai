import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6
    });

    const reply = res.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
