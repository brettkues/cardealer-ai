import { NextResponse } from "next/server";
import { adminDB } from "../../../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ message: "No URL provided." });

    await adminDB.collection("websites").add({
      url,
      createdAt: Date.now(),
    });

    return NextResponse.json({ message: "Website saved." });
  } catch (err) {
    return NextResponse.json({ message: "Error saving website." }, { status: 500 });
  }
}
