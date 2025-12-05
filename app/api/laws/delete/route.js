export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDB, adminStorage } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { id, storagePath } = await req.json();

    if (!id || !storagePath) {
      return NextResponse.json(
        { error: "Missing id or storagePath" },
        { status: 400 }
      );
    }

    // Delete Firestore record
    await adminDB.collection("lawLibrary").doc(id).delete();

    // Delete Storage file
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.delete().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
