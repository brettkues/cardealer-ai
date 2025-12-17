import { NextResponse } from "next/server";
import OpenAI from "openai";
import salesSystemPrompt from "../_system/salesPrompt";
import { embedText } from "@/lib/vectorClient";
import { searchVectors } from "@/lib/vectorStore";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1]?.content;

    const queryEmbedding = await embedText(userMessage);
    const matches = searchVectors(queryEmbedding, 8);

    const context = matches.map(m => m.text).join("\n\n");

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
${salesSystemPrompt}

DEALER TRAINING MATERIAL:
${context || "None"}

CONVERSATION:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

ANSWER AS DEALERSHIP SALES EXPERT:
`
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
