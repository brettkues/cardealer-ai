export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDB, adminStorage } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const form = await req.formData();

    const file = form.get("file");
    const state = form.get("state");
    const uid = form.get("uid");

    if (!file || !state || !uid) {
      return NextResponse.json(
        { error: "Missing file, state, or uid" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create filename + storage path
    const filename = `${Date.now()}_${file.name}`;
    const storagePath = `laws/${uid}/${filename}`;

    // Upload to Firebase Storage via admin SDK
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: { contentType: "application/pdf" },
    });

    // Make file publicly accessible URL
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    // Store metadata in Firestore
    await adminDB.collection("lawLibrary").add({
      type: "pdf",
      state,
      filename: file.name,
      url,
      owner: uid,
      storagePath,
      uploadedAt: Date.now(),
    });

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
