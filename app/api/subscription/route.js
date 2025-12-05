import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ active: false });
    }

    const ref = adminDB.collection("users").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ active: false });
    }

    const data = snap.data();
    const active = data.subscribed === true;

    return NextResponse.json({ active });
  } catch (err) {
    console.error("Subscription API error:", err);
    return NextResponse.json({ active: false });
  }
}
