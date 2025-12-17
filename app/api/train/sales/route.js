import { NextResponse } from "next/server";
import OpenAI from "openai";
import { embedText } from "@/lib/vectorClient";
import { addVector } from "@/lib/vectorStore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }

  return chunks;
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const files = form.getAll("files");

    for (const file of files) {
      const text = await file.text();
      const chunks = chunkText(text);

      for (const chunk of chunks) {
        const embedding = await embedText(chunk);

        addVector({
          embedding,
          text: chunk,
          metadata: {
            department: "sales",
            filename: file.name
          }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Training failed" }, { status: 500 });
  }
}
