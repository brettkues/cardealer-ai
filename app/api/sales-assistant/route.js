import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages, website, inventory } = await req.json();

    if (!messages) {
      return NextResponse.json(
        { error: "Missing messages array" },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are an advanced AI Sales Assistant for a car dealership.
Use the provided website URL and inventory JSON when answering questions.
Be accurate, concise, and helpful.
If asked about pricing, explain that pricing may vary and customers should contact the dealership.
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Website: ${website || "None provided"}` },
        { role: "user", content: `Inventory: ${JSON.stringify(inventory || {})}` },
        ...messages,
      ],
    });

    return NextResponse.json({
      success: true,
      reply: response.choices?.[0]?.message?.content || "",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Sales Assistant failed" },
      { status: 500 }
    );
  }
}
