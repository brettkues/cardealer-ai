import { NextResponse } from "next/server";
import OpenAI from "openai";
import salesSystemPrompt from "../_system/salesPrompt";
import { embedText } from "@/lib/vectorClient";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const question = messages[messages.length - 1]?.content || "";

    // Embed the question
    const queryEmbedding = await embedText(question);

    // Vector search directly (no RPC)
    const { data: matches, error } = await supabase
      .from("sales_training_vectors")
      .select("content, source")
      .order("embedding <=> $1", { ascending: true })
      .limit(8)
      .bind([queryEmbedding]);

    if (error) {
      return NextResponse.json({ reply: String(error) }, { status: 500 });
    }

    const context = (matches || [])
      .map((m, i) => `[SOURCE ${i + 1}] ${m.content}`)
      .join("\n\n");

    const prompt = `
${salesSystemPrompt}

RULES:
- Answer ONLY from the training material
- If not found, say: "Not found in dealership training"
- Stay in automotive dealer law and sales

TRAINING MATERIAL:
${context || "None"}

QUESTION:
${question}

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
