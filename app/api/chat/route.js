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

/* ================= CONFIDENCE ================= */

const HIGH_CONFIDENCE = 0.85;
const MIN_CONFIDENCE = 0.65;

/* ================= HELPERS ================= */

function normalize(text) {
  return (text || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
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

/*
 TRAINING AUTHORING INTENT
 - Explicitly excludes actual ADD TO BRAIN saves
 - Triggers on requests to WRITE / DRAFT training
*/
function detectTrainingAuthoringRequest(text) {
  if (/^(add to brain|add to knowledge)/i.test(text)) return false;
  return /(^|\b)(help me add training|write training|draft training|create training|add training for step)/i.test(
    text
  );
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
      allowSearch = false,
      sessionId,
    } = await req.json();

    const text = normalize(message);

    /* ===== TRAINING AUTHORING MODE (DRAFT ONLY) ===== */

    if (
      (role === "admin" || role === "manager") &&
      detectTrainingAuthoringRequest(message)
    ) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are drafting OFFICIAL dealership training content.

OUTPUT RULES (STRICT):
- Output TRAINING CONTENT ONLY
- Do NOT save anything
- Do NOT mention systems, AI, or explanations
- Follow the template EXACTLY

TEMPLATE:

F&I PROCESS – STEP X – TITLE

PURPOSE:
One clear sentence describing why this step exists.

PROCEDURE:
- Step-by-step bullet instructions
- Exact systems, screens, or actions used

WARNINGS / COMMON ERRORS:
- Compliance risks
- Common mistakes
- What must NEVER be skipped

COMPLETION CHECK:
- Clear criteria that confirms the step is done correctly
`,
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
          {
            answer: "Only managers or admins can train the AI.",
            source: "Permission denied",
          },
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

    /* ================= F&I DOMAIN (STEP-AWARE RETRIEVAL) ================= */

    if (domain === "fi") {
      if (!sessionId) {
        return NextResponse.json({
          answer: "Session error. Refresh and retry.",
          source: "System error",
        });
      }

      let state = fiSessions.get(sessionId);

      if (text === "start a deal") {
        state = { step: 1, started: true, dealType: null };
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepPrompt(1),
          source: "F&I process",
        });
      }

      if (!state || !state.started) {
        const hits = await retrieveKnowledge(message, "fi");

        if (hits?.length) {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Answer ONLY using the dealership knowledge below.\n\n" +
                  hits.map((h) => h.content).join("\n\n"),
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

        return NextResponse.json({
          answer:
            "No active deal. Ask a question or type `start a deal` to begin.",
          source: "F&I assistant",
        });
      }

      if (state.step === 1 && !state.dealType) {
        if (["cash", "finance", "lease"].includes(text)) {
          state.dealType = text;
          state.step = 2;
          fiSessions.set(sessionId, state);

          return NextResponse.json({
            answer: `Deal type set to ${text.toUpperCase()}.\n\n${getFiStepPrompt(
              2
            )}`,
            source: "F&I process",
          });
        }

        return NextResponse.json({
          answer: "Reply with: cash, finance, or lease.",
          source: "F&I process",
        });
      }

      if (text === "next") {
        state.step += 1;
        fiSessions.set(sessionId, state);

        return NextResponse.json({
          answer: getFiStepPrompt(state.step),
          source: "F&I process",
        });
      }

      const stepQuery = `[F&I STEP ${state.step}] ${message}`;
      const hits = await retrieveKnowledge(stepQuery, "fi");

      if (hits?.length) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Answer ONLY using the dealership training for this step.\n\n" +
                hits.map((h) => h.content).join("\n\n"),
            },
            { role: "user", content: message },
          ],
          temperature: 0.3,
        });

        return NextResponse.json({
          answer:
            response.choices[0].message.content +
            "\n\nType `next` when complete.",
          source: "F&I process",
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are assisting with F&I Step ${state.step}. Answer carefully. Do not advance steps.`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      });

      return NextResponse.json({
        answer:
          response.choices[0].message.content +
          "\n\nType `next` when complete.",
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
              "Answer ONLY using the dealership policy below.\n\n" +
              hits.map((h) => h.content).join("\n\n"),
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
