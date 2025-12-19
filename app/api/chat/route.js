import { NextResponse } from "next/server";

function answerSales(question) {
  const q = question.toLowerCase();

  if (q.includes("follow up") && q.includes("test drive")) {
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

    const answer = answerSales(body.message || "");

    return NextResponse.json({
      answer,
      source: "General sales knowledge (not dealership policy)",
    });
  } catch {
    return NextResponse.json(
      { answer: "Something went wrong. Please try again.", source: "System error" },
      { status: 500 }
    );
  }
}
