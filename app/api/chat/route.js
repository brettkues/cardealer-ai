import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({
        answer: "No message received.",
        source: "System",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You're a professional automotive sales assistant. " +
            "Be clear, practical, and helpful. Avoid fluff.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.5,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content,
      source: "AI-generated response",
    });
  } catch (err) {
    console.error("OpenAI error:", err);
    return NextResponse.json(
      {
        answer: "AI failed to respond.",
        source: "System error",
      },
      { status: 500 }
    );
  }
}
