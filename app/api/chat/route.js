// app/api/chat/route.js

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "@/lib/memory/personalStore";

/* ================= OPENAI ================= */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ================= IN-MEMORY F&I DEAL STATE =================
   key: sessionId
   value: {
     step: number,
     started: boolean,
     dealType: "cash" | "finance" | "lease" | null
   }
============================================================== */

const fiSessions = new Map();

/* ================= HELPERS ================= */

function normalize(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function detectMemoryIntent(text) {
  const t = normalize(text);
  if (t.startsWith("remember this")) return "remember";
  if (t.startsWith("forget")) return "forget";
  if (t === "what do you remember about me") return "recall";
  return null;
}

/* ================= F&I STEP PROMPTS ================= */

function getFiStepPrompt(step, dealType) {
  switch (step) {
    case 1:
      return "Step 1: Identify the deal type. Reply with: cash, finance, or lease.";
    case 2:
      return `Step 2: Enter the ${dealType.toUpperCase()} deal into the DMS. Verify customer, vehicle, taxes, and fees. When complete, type \`next\`.`;
    case 3:
      return "Step 3: Review approvals, stips, and backend eligibility. When complete, type `next`.";
    case 4:
      return "Step 4: Build and present the F&I menu with approved products. When complete, type `next`.";
    case 5:
      return "Step 5: Build the contract. When complete, type `next`.";
    case 6:
      return "Step 6: Confirm all required compliance documents. When complete, type `next`.";
    case 7:
      return "Step 7: Add sold products into the DMS and rebuild the contract. When complete, type `next`.";
    case 8:
      return "Step 8: Obtain all required signatures. When complete, type `next`.";
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
      sessionId,
    } = await req.json();

    const text = normalize(message || "");

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

      // START DEAL
      if (text === "start a deal") {
        state = { step: 1, started: true, dealType: null };
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepPrompt(1),
          source: "F&I process",
        });
      }

      if (!state || !state.started) {
        return NextResponse.json({
          answer: "No active deal. Type `start a deal` to begin.",
          source: "F&I process",
        });
      }

      /* ===== STEP 1: DEAL TYPE (AUTO-ADVANCE) ===== */

      if (state.step === 1 && !state.dealType) {
        if (["cash", "finance", "lease"].includes(text)) {
          state.dealType = text;
          state.step = 2;
          fiSessions.set(sessionId, state);

          return NextResponse.json({
            answer:
              `Deal type set to ${text.toUpperCase()}.\n\n` +
              getFiStepPrompt(2, state.dealType),
            source: "F&I process",
          });
        }

        return NextResponse.json({
          answer: "Please reply with a valid deal type: cash, finance, or lease.",
          source: "F&I process",
        });
      }

      /* ===== ADVANCE ONLY ON 'next' (STEP 2+) ===== */

      if (text === "next") {
        state.step += 1;
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepPrompt(state.step, state.dealType),
          source: "F&I process",
        });
      }

      /* ===== QUESTIONS DURING A STEP ===== */

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `You are assisting with F&I process Step ${state.step} for a ${state.dealType.toUpperCase()} deal. Answer the question in this context. Do not advance steps.`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      });

      return NextResponse.json({
        answer:
          response.choices[0].message.content +
          "\n\nWhen complete, type `next`.",
        source: "F&I process",
      });
    }

    /* ================= SALES / GENERAL ================= */

    const hits = await retrieveKnowledge(message, domain);

    if (hits && hits.length) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer ONLY using the dealership knowledge below.\n\n" +
              hits.map(h => h.content).join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.5,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "Dealer policy (documented)",
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
