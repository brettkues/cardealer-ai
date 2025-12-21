import { NextResponse } from "next/server";
import OpenAI from "openai";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "@/lib/memory/personalStore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TURNS = 6;

/* ------------------ helpers ------------------ */

function isCommand(text) {
  return /^(write|draft|create|summarize|generate|email|text|list)\b/i.test(text);
}

function isSimpleQuestion(text) {
  return /^(can i|what is|does|do i|how do|when do|is it)\b/i.test(
    text.trim().toLowerCase()
  );
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

/* ------------------ handler ------------------ */

export async function POST(req) {
  try {
    const {
      message,
      history = [],
      userId = "default",
      role = "sales", // sales | manager | admin
      domain = "sales",
    } = await req.json();

    const intent = detectMemoryIntent(message);

    /* ===== PERSONAL MEMORY ===== */

    if (intent === "remember") {
      const content = message.replace(/remember this[:]?/i, "").trim();
      await setPersonalMemory(userId, content);

      return NextResponse.json({
        answer: "Saved. I’ll remember that for you.",
        source: "Personal memory",
      });
    }

    if (intent === "forget") {
      await clearPersonalMemory(userId);
      return NextResponse.json({
        answer: "Done. I’ve forgotten that.",
        source: "Personal memory",
      });
    }

    if (intent === "recall") {
      const mem = await getPersonalMemory(userId);
      return NextResponse.json({
        answer: mem
          ? `Here’s what I remember about you: ${mem}`
          : "I don’t have anything saved for you yet.",
        source: "Personal memory",
      });
    }

    /* ===== COMMANDS (FAST PATH) ===== */

    if (isCommand(message)) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Execute the user's request clearly and professionally." },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "Command execution",
      });
    }

    /* ===== QUESTIONS ===== */

    let dealerKnowledge = [];
    let usedBrain = false;

    // Only embed if it looks like a real question
    if (isSimpleQuestion(message) || message.length > 12) {
      dealerKnowledge = await retrieveKnowledge(message, domain);
      usedBrain = dealerKnowledge.length > 0;
    }

    /* ===== BRAIN HIT ===== */

    if (usedBrain) {
      const systemPrompt =
        "You are a dealership-approved assistant.\n" +
        "Answer ONLY using the provided dealership guidance.\n\n" +
        dealerKnowledge.map(k => `- ${k}`).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "Dealership knowledge",
      });
    }

    /* ===== NO BRAIN HIT ===== */

    // Explicit user search request (any role)
    if (userRequestedSearch(message)) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer the question using general knowledge. Do not claim dealership authority.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "External knowledge (not stored)",
      });
    }

    // Manager/Admin: offer search
    if (role === "manager" || role === "admin") {
      return NextResponse.json({
        answer:
          "This isn’t in the dealership knowledge base. Would you like me to search for the answer?",
        source: "Knowledge gap",
      });
    }

    // Sales: stop here
    return NextResponse.json({
      answer:
        "I don’t have dealership-approved guidance on that yet.",
      source: "No dealership data",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { answer: "AI failed to respond.", source: "System error" },
      { status: 500 }
    );
  }
}
