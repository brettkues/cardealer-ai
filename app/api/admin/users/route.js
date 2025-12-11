import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "users"));

    const users = snap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ users: [] });
  }
}
