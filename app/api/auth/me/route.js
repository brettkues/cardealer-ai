export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const token = cookies().get("session")?.value;

    if (!token) {
      return NextResponse.json({ uid: null }, { status: 200 });
    }

    const decoded = await getAuth().verifyIdToken(token);

    return NextResponse.json({ uid: decoded.uid }, { status: 200 });
  } catch (err) {
    console.error("auth/me error:", err.message);
    return NextResponse.json({ uid: null }, { status: 200 });
  }
}
