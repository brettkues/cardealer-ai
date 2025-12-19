import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "../../lib/memory/personalStore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TURNS = 6;

function detectMemoryIntent(text) {
  const t = text.toLowerCase().trim();

  if (t.startsWith("remember this for me")) return "remember";
  if (t.startsWith("forget")) return "forget";

  return null;
}

export async function POST(req) {
  try {
    const { message, history = [], userId = "default" } = await req.json();

    const memoryIntent = detectMemoryIntent(message);

    // HANDLE MEMORY COMMANDS ONLY
    if (memoryIntent === "remember") {
      const content = message
        .replace(/remember this for me[:]?/i, "")
        .trim();

      setPersonalMemory(userId, content);

      return NextResponse.json({
        answer: "Got it. I’ll remember that.",
        source: "Personal memory",
      });
    }

    if (memoryIntent === "forget") {
      clearPersonalMemory(userId);

      return NextResponse.json({
        answer: "Done. I’ve forgotten that preference.",
        source: "Personal memory",
      });
    }

    // NORMAL CHAT
    const personalPreference = getPersonalMemory(userId);

    const recentHistory = history.slice(0, MAX_TURNS).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = personalPreference
      ? `You are a professional automotive sales assistant.
         Personal preference: ${personalPreference}.
         Be concise, practical, and helpful.`
      : `You are a professional automotive sales assistant.
         Be concise, practical, and helpful.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory.reverse(),
        { role: "user", content: message },
      ],
      temperature: 0.5,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content,
      source: personalPreference
        ? "AI-generated response (personal preference applied)"
        : "AI-generated response",
    });
  } catch (err) {
    return NextResponse.json(
      {
        answer: "AI failed to respond.",
        source: "System error",
      },
      { status: 500 }
    );
  }
}
