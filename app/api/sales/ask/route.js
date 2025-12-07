import { NextResponse } from "next/server";
import { runChat } from "@/lib/ai/openai";
import { searchSalesTraining } from "@/lib/ai/vector-store-sales";

export async function POST(req) {
  try {
    const { input } = await req.json();

    if (!input || input.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing input." },
        { status: 400 }
      );
    }

    // Fetch relevant stored training
    const related = await searchSalesTraining(input);
    const context = related.map((r) => r.text).join("\n\n");

    const messages = [
      {
        role: "system",
        content:
          "You are a dealership Sales Manager. Be clear, helpful, and dealership-accurate. No payments or rates. No fictional data.",
      },
      {
        role: "user",
        content: `Training context:\n${context}\n\nUser question:\n${input}`,
      },
    ];

    const answer = await runChat("gpt-4o-mini", messages);

    return NextResponse.json({ response: answer });
  } catch (err) {
    return NextResponse.json(
      { error: "Sales AI failed." },
      { status: 500 }
    );
  }
}
