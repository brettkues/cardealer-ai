// app/api/chat/route.js
// FULL DROP-IN REPLACEMENT — TRAINING → RELEVANCE CHECK → WEB → ASK TO SAVE

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

/* ================= F&I STEP GUIDANCE ================= */

function getFiStepPrompt(step) {
  switch (step) {
    case 1:
      return "STEP 1: Identify the deal type (cash, finance, or lease).";
    case 2:
      return "STEP 2: Enter the deal into the DMS accurately.";
    case 3:
      return "STEP 3: Review approvals, stips, backend eligibility, and rate limits.";
    case 4:
      return "STEP 4: Build and present the F&I menu.";
    case 5:
      return "STEP 5: Build the contract.";
    case 6:
      return "STEP 6: Confirm compliance documents.";
    case 7:
      return "STEP 7: Add products and rebuild the contract if needed.";
    case 8:
      return "STEP 8: Obtain customer signatures.";
    case 9:
      return "STEP 9: DMV processing.";
    case 10:
      return "STEP 10: Funding and close the deal.";
    default:
      return "F&I process complete.";
  }
}

function fiContinuation(sessionId) {
  const state = fiSessions.get(sessionId);
  if (!state || !state.started) return "";
  return (
    `\n\n—\nF&I Deal Status: STEP ${state.step}\n` +
    `${getFiStepPrompt(state.step)}\n\n` +
    "Commands:\n" +
    "- next\n" +
    "- resume deal\n" +
    "- go to step X\n" +
    "- restart deal"
  );
}

/* ================= LIVE WEB SEARCH (TAVILY) ================= */

async function searchWeb(query) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      include_answer: true,
      max_results: 5,
    }),
  });

  if (!res.ok) return "";

  const data = await res.json();
  return data.answer || "";
}

/* ================= TRAINING RELEVANCE CHECK ================= */

async function trainingIsRelevant(question, trainingText) {
  const check = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Answer ONLY yes or no. Does the training content directly answer the user's question?",
      },
      {
        role: "user",
        content: `QUESTION:\n${question}\n\nTRAINING:\n${trainingText}`,
      },
    ],
  });

  return check.choices[0].message.content
    .toLowerCase()
    .includes("yes");
}

/* ================= BRAIN SAVE ================= */

async function saveToBrain({ content, source_file }) {
  const DEALER_ID = process.env.DEALER_ID;
  const CHUNK_SIZE = 800;

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

  await supabase.from("sales_training_vectors").insert(rows);
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

    /* ================= F&I COMMANDS ================= */

    if (domain === "fi" && sessionId) {
      let state = fiSessions.get(sessionId);

      if (text === "start a deal") {
        state = { started: true, step: 1 };
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer:
            "F&I deal started.\n\n" +
            getFiStepPrompt(1) +
            fiContinuation(sessionId),
          source: "F&I process",
        });
      }

      if (state?.started && text === "resume deal") {
        return NextResponse.json({
          answer:
            `Resuming deal at STEP ${state.step}.\n\n` +
            getFiStepPrompt(state.step) +
            fiContinuation(sessionId),
          source: "F&I process",
        });
      }

      if (state?.started && text === "next") {
        state.step += 1;
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer:
            `Advanced to STEP ${state.step}.\n\n` +
            getFiStepPrompt(state.step) +
            fiContinuation(sessionId),
          source: "F&I process",
        });
      }

      const stepMatch = text.match(/go to step (\d+)/);
      if (state?.started && stepMatch) {
        state.step = Number(stepMatch[1]);
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer:
            `Moved to STEP ${state.step}.\n\n` +
            getFiStepPrompt(state.step) +
            fiContinuation(sessionId),
          source: "F&I process",
        });
      }
    }

    /* ================= DEALER TRAINING ================= */

    const hits = await retrieveKnowledge(message, domain);

    if (hits?.length) {
      const combinedTraining = hits.join("\n\n");
      const relevant = await trainingIsRelevant(message, combinedTraining);

      if (relevant) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "Answer ONLY using the dealership training below.\n\n" +
                combinedTraining,
            },
            { role: "user", content: message },
          ],
        });

        return NextResponse.json({
          answer:
            response.choices[0].message.content +
            fiContinuation(sessionId),
          source: "Dealer policy (documented)",
        });
      }
    }

    /* ================= LIVE WEB FALLBACK ================= */

    const webAnswer = await searchWeb(message);

    if (!webAnswer) {
      return NextResponse.json({
        answer:
          "No internal or external information found." +
          fiContinuation(sessionId),
        source: "No results",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Answer clearly using the external information below.",
        },
        { role: "user", content: webAnswer },
      ],
    });

    return NextResponse.json({
      answer:
        response.choices[0].message.content +
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
