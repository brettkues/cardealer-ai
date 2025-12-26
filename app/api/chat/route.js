import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ================= F&I PROCESS ================= */

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

/* ================= HELPERS ================= */

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

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .trim();
}

/* ================= HANDLER ================= */

export async function POST(req) {
  try {
    const {
      message,
      role = "sales",
      domain = "sales",
      userId,
      sessionId,
    } = await req.json();

    /* ========== F&I GUIDED DEAL MODE (MUST RUN FIRST) ========== */

    if (domain === "fi" && userId && sessionId) {
      const normalized = normalize(message);

      const { data: state } = await supabase
        .from("fi_deal_state")
        .select("*")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .single();

      let currentStep = state?.step || 1;
      let completed = state?.completed_steps || [];

      const completedStep = detectFiStepCompletion(message);

      if (completedStep) {
        if (!completed.includes(completedStep)) {
          completed.push(completedStep);
        }

        currentStep = Math.max(currentStep, completedStep + 1);

        await supabase.from("fi_deal_state").upsert({
          user_id: userId,
          session_id: sessionId,
          step: currentStep,
          completed_steps: completed,
          updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
          answer: `Step ${completedStep} marked complete: ${FI_STEPS[completedStep]}.`,
          source: "Deal progress",
        });
      }

      const guidedTriggers = [
        "whats next",
        "what is next",
        "start a deal",
        "start deal",
        "begin fi",
        "take me through",
        "walk me through",
      ];

      if (guidedTriggers.some(t => normalized.includes(t))) {
        await supabase.from("fi_deal_state").upsert({
          user_id: userId,
          session_id: sessionId,
          step: currentStep,
          completed_steps: completed,
          updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
          answer: `Next step: ${FI_STEPS[currentStep]}.`,
          source: "Guided deal mode",
        });
      }
    }

    /* ================= KNOWLEDGE RETRIEVAL ================= */

    const hits = await retrieveKnowledge(message, domain);

    if (hits && hits.length > 0) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer using documented dealership knowledge only.\n\n" +
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
