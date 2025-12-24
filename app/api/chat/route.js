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

const DEALER_ID = process.env.DEALER_ID;
const CHUNK_SIZE = 800;

/* ===== COMPLIANCE TRIGGERS ===== */

function hasRegulatedContent(text) {
  return /(apr|interest rate|0%|payment|\$\/mo|monthly|lease|rebate|incentive|advertis|ad\b)/i.test(
    text
  );
}

function isDefinitionIntent(text) {
  return /^(what is|what are|do i need|can i|legal|disclosure|comply)/i.test(
    text.trim().toLowerCase()
  );
}

/* ===== MEMORY ===== */

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

/* ===== SAVE TO BRAIN ===== */

async function saveToBrain({ content, source_file }) {
  await supabase
    .from("sales_training_vectors")
    .delete()
    .eq("dealer_id", DEALER_ID)
    .eq("source_file", source_file);

  const chunks = [];
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.slice(i, i + CHUNK_SIZE));
  }

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

  await supabase.from("sales_training_vectors").insert(rows);
}

/* ===== HANDLER ===== */

export async function POST(req) {
  try {
    const { message, userId = "default", role = "sales", domain = "sales" } =
      await req.json();

    /* --- TRAINING --- */

    const brainContent = detectBrainTrainingIntent(message);
    if (brainContent) {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json({ answer: "Unauthorized", source: "Denied" }, { status: 403 });
      }

      await saveToBrain({
        content: brainContent,
        source_file: `chat:${userId}:${Date.now()}`,
      });

      return NextResponse.json({
        answer: "Added to dealership brain.",
        source: "Brain training",
      });
    }

    /* --- PERSONAL MEMORY --- */

    const memoryIntent = detectMemoryIntent(message);
    if (memoryIntent === "remember") {
      await setPersonalMemory(userId, message.replace(/remember this[:]?/i, ""));
      return NextResponse.json({ answer: "Saved.", source: "Personal memory" });
    }

    if (memoryIntent === "forget") {
      await clearPersonalMemory(userId);
      return NextResponse.json({ answer: "Forgotten.", source: "Personal memory" });
    }

    if (memoryIntent === "recall") {
      const mem = await getPersonalMemory(userId);
      return NextResponse.json({ answer: mem || "Nothing saved.", source: "Personal memory" });
    }

    /* --- THINK FIRST --- */

    const base = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Answer naturally as a dealership professional.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.6,
    });

    let answer = base.choices[0].message.content;
    let source = "General dealership reasoning";
    let sourceFiles;

    /* --- COMPLIANCE ENFORCEMENT --- */

    const hits = await retrieveKnowledge(message, domain);
    if (hasRegulatedContent(message) && hits?.length) {
      const policy = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Generate a compliant response using the dealership policy below.\n\n" +
              hits.map(h => h.content).join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.2,
      });

      answer = policy.choices[0].message.content;
      source = "Dealer policy (documented)";
      sourceFiles =
        role !== "sales"
          ? Array.from(new Set(hits.map(h => h.source_file).filter(Boolean)))
          : undefined;
    } else if (isDefinitionIntent(message) && hits?.length) {
      source = "Dealer policy (documented)";
      sourceFiles =
        role !== "sales"
          ? Array.from(new Set(hits.map(h => h.source_file).filter(Boolean)))
          : undefined;
    }

    return NextResponse.json({
      answer,
      source,
      source_files: sourceFiles,
    });
  } catch {
    return NextResponse.json(
      { answer: "AI failed.", source: "System error" },
      { status: 500 }
    );
  }
}
