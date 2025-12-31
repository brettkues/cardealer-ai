// app/api/chat/route.js
// FULL DROP-IN REPLACEMENT — TRAINING → FRAMING → RELEVANCE → WEB → ASK TO SAVE

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

/* ================= QUESTION FRAMING ================= */

async function frameQuestion(originalQuestion) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are an intent interpreter for an automotive sales and F&I assistant. " +
          "Rewrite the user's question into a clear, explicit internal question that removes ambiguity, " +
          "clarifies comparisons, and preserves important qualifiers. " +
          "Do NOT answer the question. Output ONLY the rewritten question.",
      },
      { role: "user", content: originalQuestion },
    ],
  });

  return response.choices[0].message.content.trim();
}

/* ================= F&I STEP GUIDANCE ================= */

function getFiStepPrompt(step) {
  switch (step) {
    case 1:
      return "STEP 1: Identify the deal type (cash, finance, or lease).";
    case 2:
      return "STEP 2: Enter the deal accurately into the DMS.";
    case 3:
      return "STEP 3: Review approvals, stips, backend eligibility, and rate limits.";
    case 4:
      return "STEP 4: Build and present the F&I menu.";
    case 5:
      return "STEP 5: Build the contract.";
    case 6:
      return "STEP 6: Confirm compliance documents.";
    case 7:
      return "STEP 7: Add products and rebuild contract if needed.";
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

  return check.choices[0].message.content.toLowerCase().includes("yes");
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
    const { message, role = "sales", domain = "sales", sessionId } =
      await req.json();

    const text = normalize(message);

    // ✅ STEP 2 + 3: FRAME QUESTION ONCE
    const framedQuestion = await frameQuestion(message);

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
    }

    /* ================= DEALER TRAINING ================= */

    17:27:26.431 
 299 | |         answer:
17:27:26.431 
 300 | |           response.choices[0].message.content +
17:27:26.432 
 301 | |           fiContinuation(sessionId),
17:27:26.432 
 302 | |         source: "External web guidance",
17:27:26.432 
 303 | `->     });
17:27:26.432 
 304 |       } catch (err) {
17:27:26.432 
 305 |         console.error(err);
17:27:26.432 
 306 |         return NextResponse.json(
17:27:26.432 
     `----
17:27:26.432 
17:27:26.432 
  x Expression expected
17:27:26.432 
     ,-[/vercel/path0/app/api/chat/route.js:301:1]
17:27:26.432 
 301 |         fiContinuation(sessionId),
17:27:26.432 
 302 |       source: "External web guidance",
17:27:26.432 
 303 |     });
17:27:26.432 
 304 |   } catch (err) {
17:27:26.432 
     :   ^
17:27:26.432 
 305 |     console.error(err);
17:27:26.432 
 306 |     return NextResponse.json(
17:27:26.432 
 307 |       { answer: "AI failed.", source: "System error" },
17:27:26.432 
     `----
17:27:26.432 
17:27:26.433 
Caused by:
17:27:26.433 
    Syntax Error
17:27:26.433 
17:27:26.433 
Import trace for requested module:
17:27:26.433 
./app/api/chat/route.js
17:27:26.433 
17:27:26.433 
17:27:26.433 
> Build failed because of webpack errors
17:27:26.459 
Error: Command "next build" exited with 1


        return NextResponse.json({
          answer:
            response.choices[0].message.content +
            fiContinuation(sessionId),
          source: "Dealer policy (documented)",
        });
      }
    }

    /* ================= LIVE WEB FALLBACK ================= */

    const webAnswer = await searchWeb(framedQuestion);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a senior automotive sales and F&I expert. " +
            "Answer directly, practically, and persuasively. " +
            "Explain WHY it matters, WHAT risks or advantages exist, and " +
            "avoid generic or vague language.",
        },
        { role: "user", content: webAnswer || framedQuestion },
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
