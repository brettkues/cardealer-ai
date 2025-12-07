import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await adminDB.collection("websites").get();
    const websites = snapshot.docs.map((doc) => ({
      url: doc.data().url,
    }));

    return NextResponse.json({ websites });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load websites." },
      { status: 500 }
    );
  }
}
