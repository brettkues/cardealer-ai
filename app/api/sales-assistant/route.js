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
    const userMessage = messages[messages.length - 1]?.content || "";

    const queryEmbedding = await embedText(userMessage);
    const matches = searchVectors(queryEmbedding, 10);

    const context = matches.map((m, i) =>
      `[SOURCE ${i + 1}] ${m.text}`
    ).join("\n\n");

    const prompt = `
${salesSystemPrompt}

RULES (MANDATORY):
- You MUST base your answer on the TRAINING MATERIAL below
- If the answer is not found in the training, say: "Not found in dealership training"
- Do NOT answer from general knowledge
- Do NOT change industries

TRAINING MATERIAL:
${context || "None"}

QUESTION:
${userMessage}

ANSWER:
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
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
