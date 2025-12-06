import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = await getUserFromToken(token);
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}
