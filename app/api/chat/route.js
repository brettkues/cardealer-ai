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
  try {
    const {
      message,
      history = [],
      userId = "default",
      domain = "sales",
    } = await req.json();

    const intent = detectMemoryIntent(message);

    /* ===== PERSONAL MEMORY ===== */

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

    /* ===== DEALER BRAIN ONLY ===== */

    const dealerKnowledge = await retrieveKnowledge(message, domain);

    // 🔒 ABSOLUTE LOCK — NO DEALER BRAIN, NO ANSWER
    if (!dealerKnowledge || dealerKnowledge.length === 0) {
      return NextResponse.json({
        answer:
          "❌ This system is restricted to dealership training only. No answer is available.",
        source: "Dealer brain only (external knowledge disabled)",
      });
    }

    /* ===== SYSTEM PROMPT (BRAIN ONLY) ===== */

    let systemPrompt =
      "You are a dealership AI assistant.\n" +
      "You MUST answer using ONLY the dealership training provided below.\n" +
      "Do NOT use general knowledge.\n" +
      "Do NOT infer or guess.\n" +
      "If the answer is not explicitly contained in the training, say you do not have dealership-approved guidance.\n\n" +
      "DEALERSHIP TRAINING:\n" +
      dealerKnowledge.map((k) => `- ${k}`).join("\n");

    /* ===== OPENAI ===== */

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
      temperature: 0.2,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content,
      source: "Dealership training ONLY",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { answer: "AI failed to respond.", source: "System error" },
      { status: 500 }
    );
  }
}
