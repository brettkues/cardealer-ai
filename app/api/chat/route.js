import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "../../lib/memory/personalStore";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TURNS = 6;

function detectMemoryIntent(text) {
  const t = text.toLowerCase().trim();
  if (t.startsWith("remember this for me")) return "remember";
  if (t === "forget that" || t.startsWith("forget")) return "forget";
  if (t === "what do you remember about me") return "recall";
  return null;
}

export async function POST(req) {
  /* ======================
     HARD STOP — STEP 1
     ====================== */
  return NextResponse.json({
    answer: "ROUTE HIT CONFIRMED",
    source: "hard stop",
  });

  /* ===== EVERYTHING BELOW IS TEMPORARILY UNREACHABLE ===== */

  try {
    const {
      message,
      history = [],
      userId = "default",
      domain = "sales",
    } = await req.json();

    const intent = detectMemoryIntent(message);

    if (intent === "remember") {
      const content = message
        .replace(/remember this for me[:]?/i, "")
        .trim();

      await setPersonalMemory(userId, content);

      return NextResponse.json({
        answer: "Got it. I’ll remember that.",
        source: "Personal memory",
      });
    }

    if (intent === "forget") {
      await clearPersonalMemory(userId);

      return NextResponse.json({
        answer: "Done. I’ve forgotten that preference.",
        source: "Personal memory",
      });
    }

    if (intent === "recall") {
      const personalPreference = await getPersonalMemory(userId);

      return NextResponse.json({
        answer: personalPreference
          ? `Here’s what I remember about you: ${personalPreference}`
          : "I don’t have any personal preferences saved for you.",
        source: "Personal memory",
      });
    }

    const dealerKnowledge = await retrieveKnowledge(message, domain);
    const personalPreference = await getPersonalMemory(userId);

    let systemPrompt =
      "You are a professional automotive sales assistant.\n" +
      "Be concise, practical, and helpful.\n";

    if (personalPreference) {
      systemPrompt += `Personal preference: ${personalPreference}\n`;
    }

    if (dealerKnowledge.length > 0) {
      systemPrompt +=
        "\nUse the following dealership-approved guidance exactly:\n" +
        dealerKnowledge.map((k) => `- ${k}`).join("\n");
    }

    const recentHistory = history.slice(0, MAX_TURNS).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory.reverse(),
        { role: "user", content: message },
      ],
      temperature: 0.8,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content,
      source:
        dealerKnowledge.length > 0
          ? "Dealership training"
          : "General sales knowledge",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { answer: "AI failed to respond.", source: "System error" },
      { status: 500 }
    );
  }
}
