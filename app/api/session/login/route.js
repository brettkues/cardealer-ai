export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

// Cookie expires in 7 days
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    // Verify Firebase token
    const decoded = await adminAuth.verifyIdToken(token);

    const uid = decoded.uid;

    // Create HTTP-only cookie
    const res = NextResponse.json({ success: true });

    res.cookies.set("session", token, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return res;
  } catch (err) {
    console.error("Login session error:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
