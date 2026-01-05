// app/api/chat/route.js
// FULL DROP-IN — ORIGINAL LOGIC PRESERVED + HARD GUARDS ADDED

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
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
  return /\b(rate|rates|term|terms|months|72|84|96|gap|max gap|backend|advance|ltv)\b/i.test(
    text || ""
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
    case 1: return "STEP 1: Identify the deal type (cash, finance, or lease).";
    case 2: return "STEP 2: Enter the deal accurately into the DMS.";
    case 3: return "STEP 3: Review approvals, stips, backend eligibility, and rate limits.";
    case 4: return "STEP 4: Build and present the F&I menu.";
    case 5: return "STEP 5: Build the contract.";
    case 6: return "STEP 6: Confirm compliance documents.";
    case 7: return "STEP 7: Add products and rebuild if needed.";
    case 8: return "STEP 8: Obtain customer signatures.";
    case 9: return "STEP 9: DMV processing.";
    case 10: return "STEP 10: Funding and close the deal.";
    default: return "F&I process complete.";
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

/* ================= LIVE WEB SEARCH ================= */

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
          "Answer ONLY yes or no. Does the training content directly and meaningfully answer the user's question?",
      },
      {
        role: "user",
        content: `QUESTION:\n${question}\n\nTRAINING:\n${trainingText}`,
      },
    ],
  });
  return check.choices[0].message.content.toLowerCase().includes("yes");
}

/* ================= SAVE TO BRAIN ================= */
async function saveToBrain({ content, source_file, domain }) {
  const DEALER_ID = process.env.DEALER_ID;
  if (!DEALER_ID || !content) {
    throw new Error("Missing dealer ID or content");
  }

  const table =
    domain === "service"
      ? "service_training_vectors"
      : "sales_training_vectors";

  const CHUNK_SIZE = 800;

  await supabase
    .from(table)
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

  await supabase.from(table).insert(rows);
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

    /* ===== ADD TO BRAIN ===== */

    const brainMatch = message.match(
      /^(add to brain|add to knowledge|train the ai with this|save to dealership brain)[,:-]?\s*/i
    );

    if (brainMatch) {
      if (role !== "admin" && role !== "manager") {
        return NextResponse.json(
          { answer: "Only managers or admins can train the AI." },
          { status: 403 }
        );
      }

      const content = message.slice(brainMatch[0].length).trim();
      if (!content) {
        return NextResponse.json({
          answer: "Nothing to save. Please include training content.",
          source: "Brain training",
        });
      }

      await saveToBrain({
  content,
  source_file: `chat:${userId}:${Date.now()}`,
  domain,
});

      return NextResponse.json({
        answer: "Added to dealership brain.",
        source: "Brain training",
      });
    }

    const normalized = normalize(message);
    const framedQuestion = await frameQuestion(message);

    /* ================= F&I FLOW ================= */

    if (domain === "fi" && sessionId) {
      let state = fiSessions.get(sessionId);

      if (normalized === "start a deal") {
        state = { started: true, step: 1 };
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer: `F&I deal started.\n\n${getFiStepPrompt(1)}${fiContinuation(sessionId)}`,
          source: "F&I process",
        });
      }

      if (state?.started && normalized === "next") {
        state.step += 1;
        fiSessions.set(sessionId, state);
        return NextResponse.json({
          answer: `Advanced to STEP ${state.step}.\n\n${getFiStepPrompt(state.step)}${fiContinuation(sessionId)}`,
          source: "F&I process",
        });
      }
    }

    /* ================= DEALER TRAINING ================= */

    let retrievalQuery = framedQuestion;

// carry forward last user question if this looks like a follow-up
if (
  chat?.length &&
  framedQuestion.split(" ").length <= 6
) {
  const lastUser = chat.find(m => m.role === "user");
  if (lastUser) {
    retrievalQuery = `${lastUser.content}. ${framedQuestion}`;
  }
}

const hits = await retrieveKnowledge(retrievalQuery, domain);


    /* ===== SERVICE HARD STOP (NEW) ===== */

    if (domain === "service") {
  if (!hits || hits.length === 0) {
    return NextResponse.json({
      answer:
        "I don’t have that information in the Service knowledge library yet. " +
        "Please upload the relevant manual, warranty bulletin, or claims guide.",
      source: "service-knowledge",
    });
  }
}

    /* ===== RATE SHEET HARD STOP (NEW) ===== */

    if ((domain === "sales" || domain === "fi") && isRateQuestion(framedQuestion)) {
      if (!hits || hits.length === 0) {
        return NextResponse.json({
          answer:
            "I don’t have a valid rate sheet that answers this question. " +
            "Please upload the current rate sheet.",
          source: "rate-sheets",
        });
      }
    }

    if (hits && hits.length) {
      const combinedTraining = hits.join("\n\n");
      const relevant = await trainingIsRelevant(
        framedQuestion,
        combinedTraining
      );

      if (relevant) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are a senior automotive sales and F&I manager and trainer. " +
                "Answer using ONLY the dealership training below.\n\n" +
                combinedTraining,
            },
            { role: "user", content: framedQuestion },
          ],
        });

        return NextResponse.json({
          answer: response.choices[0].message.content + fiContinuation(sessionId),
          source: "Dealer policy (documented)",
        });
      }
    }

    /* ================= WEB FALLBACK ================= */

    const webAnswer = await searchWeb(framedQuestion);
    if (!webAnswer) {
      return NextResponse.json({
        answer: "No internal or external information found." + fiContinuation(sessionId),
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
            "You are an assistant to an automotive sales and F&I manager.",
        },
        { role: "user", content: webAnswer },
      ],
    });

    return NextResponse.json({
      answer: response.choices[0].message.content + fiContinuation(sessionId),
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
