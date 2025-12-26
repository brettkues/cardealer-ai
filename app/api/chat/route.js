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

/* ================= IN-MEMORY F&I DEAL STATE =================
   key: sessionId
   value: { step: number, started: boolean }
   NOTE: ephemeral by design (memory-based)
============================================================== */

const fiSessions = new Map();

/* ================= CONFIDENCE ================= */

const HIGH_CONFIDENCE = 0.85;
const MIN_CONFIDENCE = 0.65;

/* ================= HELPERS ================= */

function isCommand(text) {
  return /^(write|draft|create|summarize|generate|email|text|list)\b/i.test(text);
}

function userRequestedSearch(text) {
  return /(search|look up|google|find online|research)/i.test(text);
}

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

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
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

/* ================= F&I STEP LOGIC ================= */

function getFiStepResponse(step) {
  switch (step) {
    case 1:
      return "Step 1: Identify the deal type (cash, finance, lease).";
    case 2:
      return "Step 2: Enter the deal into the DMS. Ensure all customer and vehicle data is accurate.";
    case 3:
      return "Step 3: Review lender approval, stips, and backend product eligibility.";
    case 4:
      return "Step 4: Build and present the F&I menu with approved products.";
    case 5:
      return "Step 5: Build the contract based on the selected terms and products.";
    case 6:
      return "Step 6: Confirm all required compliance documents are present and completed.";
    case 7:
      return "Step 7: Add sold products into the DMS and rebuild the contract.";
    case 8:
      return "Step 8: Obtain all required customer signatures.";
    case 9:
      return "Step 9: Process DMV paperwork.";
    case 10:
      return "Step 10: Finalize funding and complete the deal.";
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
      allowSearch = false,
      sessionId,
    } = await req.json();

    const text = normalize(message || "");

    /* ===== EXPLICIT BRAIN TRAINING ===== */

    const brainContent = detectBrainTrainingIntent(message);

    if (brainContent) {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json(
          { answer: "Only managers or admins can train the AI.", source: "Permission denied" },
          { status: 403 }
        );
      }

      const sourceFile = `chat:${userId}:${Date.now()}`;

      await saveToBrain({
        content: brainContent,
        source_file: sourceFile,
      });

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

    /* ================= F&I DOMAIN (STATEFUL) ================= */

    if (domain === "fi") {
      if (!sessionId) {
        return NextResponse.json({
          answer: "Session error. Please refresh and try again.",
          source: "System error",
        });
      }

      let state = fiSessions.get(sessionId);

      if (text === "start a deal") {
        state = { step: 1, started: true };
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepResponse(1),
          source: "F&I process",
        });
      }

      if (text === "whats next" || text === "what is next" || text === "what's next") {
        if (!state || !state.started) {
          return NextResponse.json({
            answer: "No active deal. Say 'start a deal' to begin.",
            source: "F&I process",
          });
        }

        state.step += 1;
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepResponse(state.step),
          source: "F&I process",
        });
      }

      if (state && state.started) {
        return NextResponse.json({
          answer: `You are currently on ${getFiStepResponse(state.step)}`,
          source: "F&I process",
        });
      }
    }

    /* ================= KNOWLEDGE RETRIEVAL ================= */

    const hits = await retrieveKnowledge(message, domain);
    const topHit = hits?.[0];
    const topScore = topHit?.score ?? 0;

    let truth = "none";
    if (topScore >= HIGH_CONFIDENCE) truth = "confirmed";
    else if (topScore >= MIN_CONFIDENCE) truth = "inferred";

    if (truth === "confirmed") {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer ONLY using the dealership policy below. Do not infer.\n\n" +
              hits.map(h => h.content).join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "Dealer policy (documented)",
      });
    }

    if (allowSearch || userRequestedSearch(message)) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer using general industry knowledge. Do not imply dealership policy.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "General industry guidance",
      });
    }

    return NextResponse.json({
      answer: "No dealership guidance exists for this question.",
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
