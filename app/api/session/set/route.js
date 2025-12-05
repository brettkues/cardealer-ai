import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { error: "UID is required" },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ success: true });

    // Create secure cookie
    res.cookies.set("session_uid", uid, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
