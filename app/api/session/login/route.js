export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ success: true });

    // Clear session cookie
    res.cookies.set("session", "", {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
