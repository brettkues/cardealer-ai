import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type");

    // TEXT CHAT
    if (contentType.includes("application/json")) {
      const { messages } = await req.json();

      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.5
      });

      return NextResponse.json({ reply: res.choices[0].message.content });
    }

    // PDF ANALYSIS
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");

      const buffer = Buffer.from(await file.arrayBuffer());

      const analysis = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this automotive contract for compliance issues." },
              { type: "input_file", input_file: { data: buffer, mime_type: "application/pdf" } }
            ]
          }
        ],
        temperature: 0.4
      });

      return NextResponse.json({
        analysis: analysis.choices[0].message.content
      });
    }

    return NextResponse.json({ error: "Unsupported request" }, { status: 400 });

  } catch (e) {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
