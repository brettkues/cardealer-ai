import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { uid, role } = await req.json();

    await updateDoc(doc(db, "users", uid), { role });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
