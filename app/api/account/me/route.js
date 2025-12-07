import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = await getUserFromToken(token);
    return NextResponse.json({ user: user || null });

  } catch (err) {
    return NextResponse.json({ user: null });
  }
}
