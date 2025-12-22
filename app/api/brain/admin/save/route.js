import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEALER_ID = process.env.DEALER_ID;

export async function POST(req) {
  try {
    const { content, source_file = "admin-search", role } = await req.json();

    if (role !== "admin" && role !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!content || !DEALER_ID) {
      return NextResponse.json(
        { error: "Missing content or dealer id" },
        { status: 400 }
      );
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const { error } = await supabase
      .from("sales_training_vectors")
      .insert({
        dealer_id: DEALER_ID,
        source_file,
        chunk_index: 0,
        content,
        embedding,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Save failed" },
      { status: 500 }
    );
  }
}
