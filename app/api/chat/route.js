import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  // Side-effect: evaluate for training intent
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/knowledge/train`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  } catch {
    // intentionally silent
  }

  // Placeholder response — existing chat logic will be wired next
  return NextResponse.json({ ok: true });
}
