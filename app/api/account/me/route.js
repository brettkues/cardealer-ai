export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../../lib/auth";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    const user = token ? await getUserFromToken(token) : null;

    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
