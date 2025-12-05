import { NextResponse } from "next/server";

export async function POST(req) {
  const { uid } = await req.json();

  if (!uid) {
    return NextResponse.json({ error: "UID required" }, { status: 400 });
  }

  const res = NextResponse.json({ success: true });

  // cookie lasts 30 days
  res.cookies.set("uid", uid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/"
  });

  return res;
}
