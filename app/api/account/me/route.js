import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../../lib/auth";

export async function GET(request) {
  try {
    // Next.js 14 compatible token extraction
    const authHeader = request.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await getUserFromToken(token);
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
