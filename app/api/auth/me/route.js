export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const token = cookies().get("session")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Verify Firebase ID token with Admin SDK
    const decoded = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      user: {
        uid: decoded.uid,
        email: decoded.email || null,
      },
    });
  } catch (err) {
    console.error("auth/me error:", err.message);
    return NextResponse.json({ user: null });
  }
}
