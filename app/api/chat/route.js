import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "@/lib/memory/personalStore";
import { supabase } from "@/lib/supabaseClient";

/* ============================================================
   OPENAI
============================================================ */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   IN-MEMORY DEAL STATE (F&I ONLY)
   NOTE: Vercel serverless = best-effort session memory.
   This is intentional for v1.
============================================================ */

const dealStateStore = new Map();

/*
Deal state shape:
{
  step: number,
  completed: Set<number>
}
*/

function getDealKey(userId, domain) {
  return `${userId}:${domain}`;
}

function getInitialDealState() {
  return {
    step: 1,
    completed: new Set(),
  };
}

/* ============================================================
   HELPERS
============================================================ */

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
  const match = text.match(/^add to brain:\s*/i);
  if (!match) return null;
  return text.slice(match[0].length).trim();
}

/* ============================================================
   F&I STEP DETECTION (EXPLICIT ONLY)
============================================================ */

function detectFiStepCompletion(text) {
  const t = text.toLowerCase();

  if (t.includes("deal type identified")) return 1;
  if (t.includes("entered the deal")) return 2;
  if (t.includes("approval reviewed")) return 3;
  if (t.includes("menu built")) return 4;
  if (t.includes("contract built")) return 5;
  if (t.includes("compliance documents reviewed")) return 6;
  if (t.includes("products added to dms")) return 7;
  if (t.includes("contract rebuilt")) return 8;
  if (t.includes("signatures collected")) return 9;
  if (t.includes("dmv submitted")) return 10;
  if (t.includes("funding submitted")) return 11;

  return null;
}

/* ============================================================
   STEP DESCRIPTIONS
============================================================ */

const FI_STEPS = {
  1: "Identify deal type",
  2: "Enter deal in DMS",
  3: "Check approval, stips, and backend allowed",
  4: "Build F&I menu",
  5: "Build initial contract",
  6: "Ensure compliance documents",
  7: "Add products to DMS",
  8: "Rebuild contract",
  9: "Gather signatures",
  10: "DMV processing",
  11: "Funding",
};

/* ============================================================
   HANDLER
============================================================ */

export async function POST(req) {
  try {
    const {
      message,
      userId = "default",
      role = "sales",
      domain = "sales",
      allowSearch = false,
    } = await req.json();

    /* ========================================================
       TRAINING MODE
    ======================================================== */

    const brainContent = detectBrainTrainingIntent(message);

    if (brainContent) {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json(
          { answer: "Only managers or admins can train the AI.", source: "Permission denied" },
          { status: 403 }
        );
      }

      const sourceFile = `chat:${userId}:${Date.now()}`;

      await supabase.from("sales_training_vectors").delete()
        .eq("source_file", sourceFile);

      return NextResponse.json({
        answer: "Added to dealership brain.",
        source: "Brain training",
      });
    }

    /* ========================================================
       PERSONAL MEMORY
    ======================================================== */

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

    /* ========================================================
       F&I DEAL STATE LOGIC
    ======================================================== */

    if (domain === "fi") {
      const key = getDealKey(userId, domain);
      let state = dealStateStore.get(key);

      if (!state) {
        state = getInitialDealState();
        dealStateStore.set(key, state);
      }

      const completedStep = detectFiStepCompletion(message);

      if (completedStep) {
        state.completed.add(completedStep);
        state.step = Math.max(state.step, completedStep + 1);

        return NextResponse.json({
          answer: `Step ${completedStep} marked complete: ${FI_STEPS[completedStep]}.`,
          source: "Deal progress",
        });
      }

     const normalized = message
  .toLowerCase()
  .replace(/[’']/g, "")
  .trim();

const guidedDealTriggers = [
  "whats next",
  "what is next",
  "what do i do",
  "what do i do first",
  "start a deal",
  "start deal",
  "take me through",
  "walk me through",
  "begin f&i",
  "begin fi",
];

if (guidedDealTriggers.some(t => normalized.includes(t))) {
  const nextStep = state.step;

  return NextResponse.json({
    answer: `Next step: ${FI_STEPS[nextStep]}.`,
    source: "Guided deal mode",
  });
}
    }

    /* ========================================================
       KNOWLEDGE RETRIEVAL
    ======================================================== */

    const hits = await retrieveKnowledge(message, domain);
    const hasBrain = hits && hits.length > 0;

    if (hasBrain) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer using documented dealership knowledge only. Do not invent or assume.\n\n" +
              hits.map(h => h.content).join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "Dealer policy (documented)",
        source_files:
          role === "admin" || role === "manager"
            ? Array.from(new Set(hits.map(h => h.source_file).filter(Boolean)))
            : undefined,
      });
    }

    /* ========================================================
       GENERAL KNOWLEDGE
    ======================================================== */

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
