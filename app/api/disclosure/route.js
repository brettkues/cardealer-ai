import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { caption } = await req.json();

    if (!caption) {
      return NextResponse.json({ error: "Missing caption" }, { status: 400 });
    }

    const prompt = `
    Caption: "${caption}"

    Identify if caption contains:
      - Price
      - Payment
      - APR
      - Down payment
      - Lease terms

    If NO legal trigger → Return:
       { "needsDisclosure": false }

    If YES → Return:
       {
         "needsDisclosure": true,
         "disclosure": "Shortest legally safe disclosure possible. No filler."
       }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return NextResponse.json(parsed);

  } catch (err) {
    return NextResponse.json(
      { error: "Disclosure AI failed", details: err.message },
      { status: 500 }
    );
  }
}
