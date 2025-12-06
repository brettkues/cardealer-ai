import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await getUserFromToken(token);
    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
