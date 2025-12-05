import { NextResponse } from "next/server";

export async function GET(req) {
  const uid = req.cookies.get("uid")?.value || null;

  return NextResponse.json({ uid });
}
