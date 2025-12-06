import { NextResponse } from "next/server";
import { adminDB } from "../../../../lib/firebaseAdmin"; // correct depth for route groups

export async function GET() {
  try {
    const snapshot = await adminDB.collection("websites").get();
    const list = snapshot.docs.map((d) => d.data().url);

    return NextResponse.json({ websites: list });
  } catch (err) {
    return NextResponse.json({ websites: [] });
  }
}
