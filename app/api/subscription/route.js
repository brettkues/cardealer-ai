import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ active: false });

    const snap = await adminDB.collection("users").doc(uid).get();

    if (!snap.exists) return NextResponse.json({ active: false });

    const data = snap.data();

    return NextResponse.json({
      active: data.subscribed === true
    });
  } catch (err) {
    console.error("Subscription API error:", err);
    return NextResponse.json({ active: false });
  }
}
