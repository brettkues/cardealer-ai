import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// how many past turns to include
const MAX_TURNS = 6;

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    const recentHistory = history.slice(0, MAX_TURNS).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional automotive sales assistant. " +
            "Be concise, practical, and helpful.",
        },
        ...recentHistory.reverse(),
        { role: "user", content: message },
      ],
      temperature: 0.5,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content,
      source: "AI-generated response",
    });
  } catch (err) {
    return NextResponse.json(
      { answer: "AI failed to respond.", source: "System error" },
      { status: 500 }
    );
  }
}
