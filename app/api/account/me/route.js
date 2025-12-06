import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");

    // No token → return null user
    if (!authHeader) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await getUserFromToken(token);

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("ACCOUNT /me ERROR:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
