import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({ status: "ok" });

  const uid = response.cookies.get("uid")?.value || null;

  return NextResponse.json({ uid });
}
