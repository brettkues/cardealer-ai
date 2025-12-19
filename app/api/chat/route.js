import { NextResponse } from "next/server";

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function answerSales(question) {
  const q = normalize(question);

  const hasFollowUp =
    q.includes("follow up") || q.includes("followup");

  if (hasFollowUp && q.includes("test drive")) {
    return (
      "Hi [Name], thanks again for taking the [Vehicle] for a drive today. " +
      "Do you have any questions I can answer, or would you like to take the next step?"
    );
  }

  return "Tell me a bit more about what you’re looking to accomplish and I’ll help.";
}

export async function POST(req) {
  try {
    const body = await req.json();

    return NextResponse.json({
      answer: answerSales(body.message || ""),
      source: "General sales knowledge (not dealership policy)",
    });
  } catch {
    return NextResponse.json(
      {
        answer: "Something went wrong. Please try again.",
        source: "System error",
      },
      { status: 500 }
    );
  }
}
