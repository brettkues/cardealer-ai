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
      allowSearch = false,
    } = await req.json();

    /* ===== MEMORY ===== */

    const memoryIntent = detectMemoryIntent(message);

    if (memoryIntent === "remember") {
      const content = message.replace(/remember this[:]?/i, "").trim();
      await setPersonalMemory(userId, content);
      return NextResponse.json({
        answer: "Saved. I’ll remember that.",
        source: "Personal memory",
      });
    }

    if (memoryIntent === "forget") {
      await clearPersonalMemory(userId);
      return NextResponse.json({
        answer: "Done. I’ve forgotten that.",
        source: "Personal memory",
      });
    }

    if (memoryIntent === "recall") {
      const mem = await getPersonalMemory(userId);
      return NextResponse.json({
        answer: mem || "I don’t have anything saved yet.",
        source: "Personal memory",
      });
    }

    /* ===== ALWAYS CHECK BRAIN FIRST ===== */

    const dealerKnowledge = await retrieveKnowledge(message, domain);
    const hasBrain = dealerKnowledge && dealerKnowledge.length > 0;

    /* ===== COMMANDS ===== */

    if (isCommand(message)) {
      const messages = [];

      if (hasBrain) {
        messages.push({
          role: "system",
          content:
            "Use the following dealership-approved guidance if relevant:\n\n" +
            dealerKnowledge.map(k => k).join("\n\n"),
        });
      }

      messages.push({ role: "user", content: message });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.6,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: hasBrain ? "Dealership knowledge" : "Command execution",
      });
    }

    /* ===== QUESTIONS WITH BRAIN ===== */

    if (hasBrain) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer ONLY using the following dealership-approved information:\n\n" +
              dealerKnowledge.map(k => k).join("\n\n"),
          },
          { role: "user", content: message },
        ],
        temperature: 0.4,
      });

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "Dealership knowledge",
      });
    }

    /* ===== NO BRAIN ===== */

    if (allowSearch || userRequestedSearch(message)) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Answer using general knowledge. Do not claim dealership authority.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      });

      if (role === "admin" || role === "manager") {
        return NextResponse.json({
          answer:
            response.choices[0].message.content +
            "\n\nShould I save this to the dealership brain?",
          source: "External knowledge",
          canSave: true,
          savePayload: response.choices[0].message.content,
        });
      }

      return NextResponse.json({
        answer: response.choices[0].message.content,
        source: "External knowledge",
      });
    }

    /* ===== OFFER SEARCH ===== */

    if (role === "manager" || role === "admin") {
      return NextResponse.json({
        answer:
          "This is not in the dealership brain. Would you like me to search for it?",
        source: "Knowledge gap",
        needsSearchApproval: true,
      });
    }

    return NextResponse.json({
      answer: "I don’t have dealership-approved guidance on that yet.",
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
