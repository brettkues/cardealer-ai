import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ user: null });
    }

    const token = authorization.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      user: {
        uid: decoded.uid,
        email: decoded.email,
      },
    });
  } catch (err) {
    console.error("Session error:", err);
    return NextResponse.json({ user: null });
  }
}
