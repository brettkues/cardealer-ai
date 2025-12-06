export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../../lib/auth";

export async function GET(req) {
  try {
    // Read token from headers (runtime only, not static)
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await getUserFromToken(token);

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
