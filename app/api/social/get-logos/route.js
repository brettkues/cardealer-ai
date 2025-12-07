import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await adminDB.collection("logos").get();
    const logos = snapshot.docs.map((doc) => doc.data().url);

    return NextResponse.json({ logos });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load logos." },
      { status: 500 }
    );
  }
}
