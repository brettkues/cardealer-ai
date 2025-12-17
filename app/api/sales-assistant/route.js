import { NextResponse } from "next/server";
import OpenAI from "openai";
import salesSystemPrompt from "../_system/salesPrompt";
import { embedText } from "@/lib/vectorClient";
import { searchVectors } from "@/lib/vectorStore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1]?.content;

    if (!userMessage) {
      return NextResponse.json({ reply: "Ask a question." });
    }

    const queryEmbedding = await embedText(userMessage);
    const matches = searchVectors(queryEmbedding);

    const context = matches.map(m => m.text).join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: salesSystemPrompt },
        ...(context ? [{ role: "system", content: `Dealer Knowledge:\n${context}` }] : []),
        ...messages
      ]
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "No response generated.";

    return NextResponse.json({ reply });

  } catch (err) {
    console.error("Sales Assistant Error:", err);
    return NextResponse.json(
      { reply: "AI error occurred." },
      { status: 500 }
    );
  }
}
