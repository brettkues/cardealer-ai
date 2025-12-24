// app/api/chat/route.js
// SINGLE-FILE REPLACEMENT

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "@/lib/memory/personalStore";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ================= CONFIG ================= */

const DEALER_ID = process.env.DEALER_ID;
const HIGH_CONFIDENCE = 0.85;
const CHUNK_SIZE = 800;

/* ================= HELPERS ================= */

function detectMemoryIntent(text) {
  const t = text.toLowerCase().trim();
  if (t.startsWith("remember this")) return "remember";
  if (t.startsWith("forget")) return "forget";
  if (t === "what do you remember about me") return "recall";
  return null;
}

function detectBrainTrainingIntent(text) {
  const match = text.match(
    /^(add to brain|add to knowledge|train the ai with this|save to dealership brain)[,:-]?\s*/i
  );
  if (!match) return null;
  return text.slice(match[0].length).trim();
}

function isDefinitionQuestion(text) {
  return /^(what is|what are|do i need|does|is|are)\b/i.test(
    text.trim().toLowerCase()
  );
}

function chunkText(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

/* ================= BRAIN SAVE ================= */

async function saveToBrain({ content, source_file }) {
  if (!DEALER_ID || !content || !source_file) {
    throw new Error("Missing dealer, content, or source_file");
  }

  await supabase
    .from("sales_training_vectors")
    .delete()
    .eq("dealer_id", DEALER_ID)
    .eq("source_file", source_file);

  const chunks = chunkText(content);

  const embeddings = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunks,
  });

  const rows = chunks.map((chunk, i) => ({
    dealer_id: DEALER_ID,
    source_file,
    chunk_index: i,
    content: chunk,
    embedding: embeddings.data[i].embedding,
  }));

  const { error } = await supabase
    .from("sales_training_vectors")
    .insert(rows);

  if (error) throw error;
}

/* ================= HANDLER ================= */

export async function POST(req) {
  try {
    const {
      message,
      userId = "default",
      role = "sales",
      domain = "sales",
    } = await req.json();

    /* ===== EXPLICIT BRAIN TRAINING ===== */

    const brainContent = detectBrainTrainingIntent(message);

    if (brainContent) {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json(
          { answer: "Only managers or admins can train the AI.", source: "Permission denied" },
          { status: 403 }
        );
      }

      const source_file = `chat:${userId}:${new Date().toISOString()}`;

      await saveToBrain({ content: brainContent, source_file });

      return NextResponse.json({
        answer: "Added to dealership brain.",
        source: "Brain training",
      });
    }

    /* ===== PERSONAL MEMORY ===== */

    const memoryIntent = detectMemoryIntent(message);

    if (memoryIntent === "remember") {
      const content = message.replace(/remember this[:]?/i, "").trim();
      await setPersonalMemory(userId, content);
      return NextResponse.json({ answer: "Saved.", source: "Personal memory" });
    }

    if (memoryIntent === "forget") {
      await clearPersonalMemory(userId);
      return NextResponse.json({ answer: "Forgotten.", source: "Personal memory" });
    }

    if (memoryIntent === "recall") {
      const mem = await getPersonalMemory(userId);
      return NextResponse.json({
        answer: mem || "Nothing saved.",
        source: "Personal memory",
      });
    }

    /* ===== STEP 1: THINK FIRST ===== */

    const baseResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Answer naturally using dealership reasoning. Do not cite policy unless confirmed.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.6,
    });

    let answer = baseResponse.choices[0].message.content;
    let source = "General dealership reasoning";
    let sourceFiles;

    /* ===== STEP 2: RETRIEVE ===== */

    const hits = await retrieveKnowledge(message, domain);
    const topScore = hits?.[0]?.score ?? 0;
    const hasAnyHits = hits && hits.length > 0;

    /* ===== STEP 3: FORCE POLICY FOR DEFINITIONS ===== */

    if (
      hasAnyHits &&
      (topScore >= HIGH_CONFIDENCE || isDefinitionQuestion(message))
    ) {
      const policyResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer using the following dealership policy. Override prior reasoning if needed.\n\n" +
              hits.map(h => h.content).join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.2,
      });

      answer = policyResponse.choices[0].message.content;
      source = "Dealer policy (documented)";
      sourceFiles =
        role !== "sales"
          ? Array.from(new Set(hits.map(h => h.source_file).filter(Boolean)))
          : undefined;
    }

    /* ===== FINAL ===== */

    return NextResponse.json({
      answer,
      source,
      source_files: sourceFiles,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { answer: "AI failed.", source: "System error" },
      { status: 500 }
    );
  }
}
