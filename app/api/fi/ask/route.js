import { NextResponse } from "next/server";
import { searchFITraining } from "@/lib/ai/vector-store-fi";
import { runChat } from "@/lib/ai/openai";

export async function POST(req) {
  try {
    const { input } = await req.json();

    const related = await searchFITraining(input);
    const context = related.map(r => r.text).join("\n\n");

    const messages = [
      {
        role: "system",
        content:
          "You are a dealership Finance & Insurance Manager. You must be compliance-focused, factual, and correct. Do NOT quote rates or calculate payments. If the user mentions a payment, you may speak about it only within compliance rules."
      },
      {
        role: "user",
        content: `Training context:\n${context}\n\nUser question:\n${input}`
      }
    ];

    const response = await runChat("gpt-4o-mini", messages);

    return NextResponse.json({ response }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { response: "Error processing F&I question." },
      { status: 200 }
    );
  }
}
