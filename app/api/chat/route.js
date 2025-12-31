// app/api/chat/route.js
// DROP-IN REPLACEMENT — USE THIS FILE

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
      "\n\n—\nThis answer was based on external information, not dealership training.\n" +
      "Would you like to add this to training?\n\n" +
      "If yes, copy and send:\nADD TO BRAIN:"
    );
  }
  return "";
}

function fiContinuation(sessionId) {
  const state = fiSessions.get(sessionId);
  if (!state || !state.started) return "";
  return (
    `\n\n—\nF&I Deal Status: STEP ${state.step}\n` +
    "Commands:\n" +
    "- next\n" +
    "- resume deal\n" +
    "- go to step X\n" +
    "- restart deal"
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

    /* ================= F&I DEAL COMMANDS ================= */

    if (domain === "fi" && sessionId) {
      let state = fiSessions.get(sessionId);

      if (text === "start a deal") {
        state = { started: true, step: 1 };
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer: "F&I deal started. You are on STEP 1.",
          source: "F&I process",
        });
      }

      if (state?.started && text === "resume deal") {
        return NextResponse.json({
          answer: `Resuming deal at STEP ${state.step}.`,
          source: "F&I process",
        });
      }

      if (state?.started && text === "restart deal") {
        fiSessions.set(sessionId, { started: true, step: 1 });
        return NextResponse.json({
          answer: "Deal restarted. Back to STEP 1.",
          source: "F&I process",
        });
      }

      if (state?.started && text === "next") {
        state.step += 1;
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer: `Advanced to STEP ${state.step}.`,
          source: "F&I process",
        });
      }

      const stepMatch = text.match(/go to step (\d+)/);
      if (state?.started && stepMatch) {
        state.step = Number(stepMatch[1]);
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer: `Moved to STEP ${state.step}.`,
          source: "F&I process",
        });
      }
    }

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
            content:
              "You are drafting OFFICIAL dealership training content. Output training only.",
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

    /* ================= RATE-FIRST RETRIEVAL ================= */

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
          answer:
            response.choices[0].message.content +
            fiContinuation(sessionId),
          source: "Rate sheet (active)",
        });
      }
    }

    /* ================= DEALER TRAINING ================= */

    const hits = await retrieveKnowledge(message, domain);

    if (hits?.length) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer ONLY using the dealership training below.\n\n" +
              hits.join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      });

      return NextResponse.json({
        answer:
          response.choices[0].message.content +
          fiContinuation(sessionId),
        source: "Dealer policy (documented)",
      });
    }

    /* ================= LIVE WEB SEARCH (NEW) ================= */

    const webResponse = await openai.responses.create({
      model: "gpt-4.1",
      tools: [{ type: "web_search" }],
      input: message,
    });

    const webAnswer =
      webResponse.output_text || "No external information found.";

    return NextResponse.json({
      answer:
        webAnswer +
        trainingPrompt(role) +
        fiContinuation(sessionId),
      source: "External web guidance",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { answer: "AI failed.", source: "System error" },
      { status: 500 }
    );
  }
}
