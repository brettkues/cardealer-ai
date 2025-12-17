import { NextResponse } from "next/server";
import OpenAI from "openai";
import salesSystemPrompt from "@/app/api/_system/salesPrompt";
import { embedText } from "@/lib/vectorClient";
import { searchVectors } from "@/lib/vectorStore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    const queryEmbedding = await embedText(userMessage);
    const matches = searchVectors(queryEmbedding);

    const context = matches.map(m => m.text).join("\n\n");

    const finalMessages = [
      { role: "system", content: salesSystemPrompt },
      { role: "system", content: `Dealer Knowledge:\n${context}` },
      ...messages
    ];

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: finalMessages,
      temperature: 0.6
    });

    return NextResponse.json({
      reply: res.choices[0].message.content
    });

  } catch (err) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
