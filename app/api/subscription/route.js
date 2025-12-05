import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ active: false });

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return NextResponse.json({ active: false });

    const data = snap.data();
    return NextResponse.json({ active: data.subscribed === true });
  } catch (err) {
    return NextResponse.json({ active: false });
  }
}
