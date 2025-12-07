import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || url.trim().length === 0) {
      return NextResponse.json(
        { error: "URL is required." },
        { status: 400 }
      );
    }

    await adminDB.collection("websites").add({
      url: url.trim(),
      createdAt: Date.now(),
    });

    return NextResponse.json({ message: "Website saved." });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save website." },
      { status: 500 }
    );
  }
}
