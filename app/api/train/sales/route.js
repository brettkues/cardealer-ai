import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const form = await req.formData();
    const files = form.getAll("files");

    for (let file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Learn this for automotive SALES training." },
              { type: "input_file", input_file: { data: buffer, mime_type: file.type } }
            ]
          }
        ]
      });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    return NextResponse.json({ error: "Training failed" }, { status: 500 });
  }
}
