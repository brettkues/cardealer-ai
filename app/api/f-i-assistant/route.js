import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages) {
      return NextResponse.json(
        { error: "Missing messages array" },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are an AI Finance & Insurance (F&I) Manager for a car dealership.
Explain products such as service contracts, GAP, tire & wheel, maintenance plans, and warranties clearly and accurately.
Use simple language customers understand.
Never give legal advice. Never state guaranteed approval. Avoid quoting specific rates.
Focus on benefits, risk reduction, cost protection, and peace of mind.
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    return NextResponse.json({
      success: true,
      reply: response.choices?.[0]?.message?.content || "",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "F&I Assistant failed" },
      { status: 500 }
    );
  }
}
