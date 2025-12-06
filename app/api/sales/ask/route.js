import { NextResponse } from "next/server";
import { searchSalesTraining } from "../../../../lib/ai/vector-store-sales";
import { runChat } from "../../../../lib/ai/openai";

export async function POST(req) {
  try {
    const { input } = await req.json();

    // Retrieve relevant training memory
    const related = await searchSalesTraining(input);
    const context = related.map((r) => r.text).join("\n\n");

    const messages = [
      {
        role: "system",
        content: "You are a dealership sales assistant. Be clear, concise, and dealership-appropriate."
      },
      {
        role: "user",
        content: `Training context:\n${context}\n\nUser question:\n${input}`
      }
    ];

    const response = await runChat("gpt-4o-mini", messages);

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json({ response: "Error processing request." });
  }
}
