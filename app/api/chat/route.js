import { NextResponse } from "next/server";
import {
  setPersonalMemory,
  getPersonalMemory,
  clearPersonalMemory,
} from "../../lib/memory/personalStore";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";

export async function POST(req) {
  try {
    const {
      message,
      userId = "default",
      domain = "sales",
    } = await req.json();

    // ===== MEMORY COMMANDS (unchanged) =====
    const t = message.toLowerCase().trim();

    if (t.startsWith("remember this for me")) {
      const content = message
        .replace(/remember this for me[:]?/i, "")
        .trim();

      await setPersonalMemory(userId, content);

      return NextResponse.json({
        answer: "Got it. I’ll remember that.",
        source: "Personal memory",
      });
    }

    if (t === "forget that" || t.startsWith("forget")) {
      await clearPersonalMemory(userId);

      return NextResponse.json({
        answer: "Done. I’ve forgotten that preference.",
        source: "Personal memory",
      });
    }

    if (t === "what do you remember about me") {
      const personalPreference = await getPersonalMemory(userId);

      return NextResponse.json({
        answer: personalPreference
          ? `Here’s what I remember about you: ${personalPreference}`
          : "I don’t have any personal preferences saved for you.",
        source: "Personal memory",
      });
    }

    // ===== DEALER BRAIN DEBUG =====
    const dealerKnowledge = await retrieveKnowledge(message, domain);

    return NextResponse.json({
      answer: "DEALER BRAIN DEBUG",
      dealerKnowledge,
      source: "debug",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { answer: "DEBUG ERROR", error: err.message },
      { status: 500 }
    );
  }
}
