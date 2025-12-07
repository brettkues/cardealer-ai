import { NextResponse } from "next/server";
import { searchFITraining } from "@/lib/ai/vector-store-fi";
import { runChat } from "@/lib/ai/openai";

export async function POST(req) {
  try {
    const { input } = await req.json();

    if (!input || input.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing input." },
        { status: 400 }
      );
    }

    // Retrieve similar stored training
    const related = await searchFITraining(input);
    const context = related.map((r) => r.text).join("\n\n");

    const messages = [
      {
        role: "system",
        content:
          "You are a Finance & Insurance Manager. Follow compliance rules. No quoting payments, APRs, or rates. Reference context when helpful.",
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
      { error: "F&I AI failed." },
      { status: 500 }
    );
  }
}
