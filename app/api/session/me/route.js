import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const uid = cookieStore.get("uid")?.value || null;

    return NextResponse.json({ uid });
  } catch (err) {
    return NextResponse.json({ uid: null });
  }
}
