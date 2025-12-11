import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional automotive sales expert assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
    });

    const text = completion.choices?.[0]?.message?.content || "";

    return NextResponse.json({ response: text });
  } catch (err) {
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 500 }
    );
  }
}
