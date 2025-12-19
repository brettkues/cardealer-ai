import { NextResponse } from "next/server";
import { retrieveKnowledge } from "../../lib/knowledge/retrieve";

export async function POST(req) {
  try {
    const body = await req.json();

    const knowledge = await retrieveKnowledge({
      domain: body.domain || "sales",
      userId: body.user?.id || null,
    });

    return NextResponse.json({
      answer: "retrieveKnowledge OK",
      source: "Isolation",
      debug: knowledge,
    });
  } catch (err) {
    console.error("RETRIEVE KNOWLEDGE ERROR:", err);

    return NextResponse.json(
      {
        answer: "retrieveKnowledge crashed",
        source: "Isolation error",
        error: err.message || String(err),
      },
      { status: 500 }
    );
  }
}
