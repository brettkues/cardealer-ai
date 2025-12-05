export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";

export async function POST(req) {
  try {
    const { id, storagePath } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing document ID" },
        { status: 400 }
      );
    }

    // Delete Firestore document
    await adminDB.collection("lawLibrary").doc(id).delete();

    // Delete storage file if provided
    if (storagePath) {
      const bucket = getStorage().bucket();
      await bucket.file(storagePath).delete().catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
