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
   value: {
     step: number,
     started: boolean,
     dealType: "cash" | "finance" | "lease" | null
   }
   NOTE: ephemeral by design
============================================================== */

const fiSessions = new Map();

/* ================= CONFIDENCE ================= */

const HIGH_CONFIDENCE = 0.85;
const MIN_CONFIDENCE = 0.65;

/* ================= HELPERS ================= */

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function userRequestedSearch(text) {
  return /(search|look up|google|find online|research)/i.test(text);
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

/* ================= F&I STEP CONTENT ================= */

function getFiStepPrompt(step, dealType) {
  switch (step) {
    case 1:
      return "Step 1: Identify the deal type. Reply with: cash, finance, or lease.";
    case 2:
      return "Step 2: Enter the deal into the DMS. Verify customer, vehicle, taxes, and fees. When complete, type `next`.";
    case 3:
      return "Step 3: Review approvals, stips, backend eligibility, and rate markup limits. When complete, type `next`.";
    case 4:
      return "Step 4: Build and present the F&I menu with approved products. When complete, type `next`.";
    case 5:
      return "Step 5: Build the contract based on selected terms and products. When complete, type `next`.";
    case 6:
      return "Step 6: Confirm all required compliance documents are present and completed. When complete, type `next`.";
    case 7:
      return "Step 7: Add sold products into the DMS and rebuild the contract. When complete, type `next`.";
    case 8:
      return "Step 8: Obtain all required customer signatures. When complete, type `next`.";
    case 9:
      return "Step 9: Process DMV paperwork. When complete, type `next`.";
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

    const text = normalize(message);

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

    /* ================= F&I DOMAIN ================= */

    if (domain === "fi") {
      if (!sessionId) {
        return NextResponse.json({
          answer: "Session error. Please refresh and try again.",
          source: "System error",
        });
      }

      let state = fiSessions.get(sessionId);

      /* ---- START DEAL ---- */
      if (text === "start a deal") {
        state = { step: 1, started: true, dealType: null };
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepPrompt(1),
          source: "F&I process",
        });
      }

      /* ---- OPEN CHAT MODE (NO ACTIVE DEAL) ---- */
      if (!state || !state.started) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an F&I assistant. Answer questions, explain procedures, and accept training. Do not assume an active deal unless one is started.",
            },
            { role: "user", content: message },
          ],
          temperature: 0.5,
        });

        return NextResponse.json({
          answer:
            response.choices[0].message.content +
            "\n\n(Type `start a deal` to begin a guided process.)",
          source: "F&I assistant",
        });
      }

      /* ---- STEP 1: DEAL TYPE (AUTO-ADVANCE) ---- */
      if (state.step === 1 && !state.dealType) {
        if (["cash", "finance", "lease"].includes(text)) {
          state.dealType = text;
          state.step = 2;
          fiSessions.set(sessionId, state);

          return NextResponse.json({
            answer: `Deal type set to ${text.toUpperCase()}.\n\n${getFiStepPrompt(2)}`,
            source: "F&I process",
          });
        }

        return NextResponse.json({
          answer: "Please reply with a valid deal type: cash, finance, or lease.",
          source: "F&I process",
        });
      }

      /* ---- BACK NAVIGATION ---- */
      if (text === "back") {
        if (state.step > 1) {
          state.step -= 1;
          fiSessions.set(sessionId, state);

          return NextResponse.json({
            answer: getFiStepPrompt(state.step, state.dealType),
            source: "F&I process",
          });
        }

        return NextResponse.json({
          answer: "You are already at Step 1.",
          source: "F&I process",
        });
      }

      /* ---- NEXT STEP ---- */
      if (text === "next") {
        state.step += 1;
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepPrompt(state.step, state.dealType),
          source: "F&I process",
        });
      }

      /* ---- QUESTIONS WITHIN A STEP ---- */
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are assisting with F&I Step ${state.step} (${state.dealType}). Answer in context. Do NOT advance steps.`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      });

      return NextResponse.json({
        answer:
          response.choices[0].message.content +
          "\n\nWhen complete, type `next` or `back`.",
        source: "F&I process",
      });
    }

    /* ================= SALES / GENERAL ================= */

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
              "Answer ONLY using the dealership policy below.\n\n" +
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
