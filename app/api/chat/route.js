import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  // Pass message through training endpoint (side-effect only)
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/knowledge/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});

  // Continue normal chat handling (existing logic lives elsewhere)
  return NextResponse.json({ ok: true });
}
