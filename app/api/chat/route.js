// app/api/chat/route.js

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "@/lib/memory/personalStore";
import { supabase } from "@/lib/supabaseClient";
import OpenAIClient from "openai";

/* ================= OPENAI ================= */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embedClient = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ================= F&I SESSION STATE ================= */

const fiSessions = new Map();

/* ================= HELPERS ================= */

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function isRateQuestion(text) {
  return /\b(rate|rates|term|months|72|84|96|max gap|gap|max backend|advance|ltv|year)\b/i.test(
    text
  );
}

function detectMemoryIntent(text) {
  const t = normalize(text);
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

function detectTrainingAuthoringRequest(text) {
  if (/^(add to brain|add to knowledge)/i.test(text)) return false;
  return /(^|\b)(help me add training|write training|draft training|create training|add training for step)/i.test(
    text
  );
}

function trainingPrompt(role) {
  if (role === "admin" || role === "manager") {
    return (
      "\n\n—\nThis answer was based on general knowledge, not dealership training.\n" +
      "If you want to save this for future use, copy it and send:\n" +
      "ADD TO BRAIN:"
    );
  }
  return "";
}

/* ================= BRAIN SAVE ================= */

async function saveToBrain({ content, source_file }) {
  const DEALER_ID = process.env.DEALER_ID;
  const CHUNK_SIZE = 800;

  if (!DEALER_ID || !content) {
    throw new Error("Missing dealer or content");
  }

  await supabase
    .from("sales_training_vectors")
    .delete()
    .eq("dealer_id", DEALER_ID)
    .eq("source_file", source_file);

  const chunks = [];
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.slice(i, i + CHUNK_SIZE));
  }

  const embeddings = await embedClient.embeddings.create({
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

/* ================= F&I STEP PROMPTS ================= */

function getFiStepPrompt(step) {
  switch (step) {
    case 1:
      return "Step 1: Identify the deal type. Reply with: cash, finance, or lease.";
    case 2:
      return "Step 2: Enter the deal into the DMS. Type `next` when complete or ask questions.";
    case 3:
      return "Step 3: Review approvals, stips, backend eligibility, and rate limits. Type `next` when complete.";
    case 4:
      return "Step 4: Build and present the F&I menu. Type `next` when complete.";
    case 5:
      return "Step 5: Build the contract. Type `next` when complete.";
    case 6:
      return "Step 6: Confirm compliance documents. Type `next` when complete.";
    case 7:
      return "Step 7: Add products and rebuild contract. Type `next` when complete.";
    case 8:
      return "Step 8: Obtain signatures. Type `next` when complete.";
    case 9:
      return "Step 9: DMV processing. Type `next` when complete.";
    case 10:
      return "Step 10: Funding and close.";
    default:
      return "F&I process complete.";
  }
}

/* ================= HANDLER ================= */

export async function POST(req) {
  try {
    const {
      message,
      userId = "default",
      role = "sales",
      domain = "sales",
      sessionId,
    } = await req.json();

    const text = normalize(message);
    const rateIntent = isRateQuestion(text);

    /* ===== TRAINING AUTHORING MODE ===== */

    if (
      (role === "admin" || role === "manager") &&
      detectTrainingAuthoringRequest(message)
    ) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are drafting OFFICIAL dealership training content.`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.2,
      });

      return NextResponse.json({
        answer:
          response.choices[0].message.content +
          "\n\nCOPY & PASTE USING:\nADD TO BRAIN:",
        source: "Training authoring mode",
      });
    }

    /* ===== EXPLICIT BRAIN TRAINING ===== */

    const brainContent = detectBrainTrainingIntent(message);

    if (brainContent) {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json(
          { answer: "Only managers or admins can train the AI." },
          { status: 403 }
        );
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

    /* ===== PERSONAL MEMORY ===== */

    const memoryIntent = detectMemoryIntent(message);

    if (memoryIntent === "remember") {
      await setPersonalMemory(
        userId,
        message.replace(/remember this[:]?/i, "").trim()
      );
      return NextResponse.json({ answer: "Saved." });
    }

    if (memoryIntent === "forget") {
      await clearPersonalMemory(userId);
      return NextResponse.json({ answer: "Forgotten." });
    }

    if (memoryIntent === "recall") {
      return NextResponse.json({
        answer: (await getPersonalMemory(userId)) || "Nothing saved.",
      });
    }

    /* ================= RATE-PRIORITY RETRIEVAL ================= */

    if (rateIntent) {
      const rateHits = await retrieveKnowledge(
        `RATE_SHEET ${message}`,
        domain
      );

      if (rateHits?.length) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Answer ONLY using the active rate sheet content below.\n\n" +
                rateHits.join("\n\n"),
            },
            { role: "user", content: message },
          ],
          temperature: 0.2,
        });

        return NextResponse.json({
          answer: response.choices[0].message.content,
          source: "Rate sheet (active)",
        });
      }
    }

    /* ================= NORMAL RETRIEVAL ================= */

    const hits = await retrieveKnowledge(message, domain);

    if (hits?.length) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer ONLY using the dealership policy below.\n\n" +
              hits.join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "Dealer policy (documented)",
      });
    }

    /* ================= FALLBACK ================= */

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      temperature: 0.4,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content + trainingPrompt(role),
      source: "General industry guidance",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { answer: "AI failed.", source: "System error" },
      { status: 500 }
    );
  }
}
