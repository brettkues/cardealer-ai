export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { token } = await req.json();

    const user = token ? await getUserFromToken(token) : null;

    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
