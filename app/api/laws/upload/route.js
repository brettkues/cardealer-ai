export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";

export async function POST(req) {
  try {
    const data = await req.formData();

    const file = data.get("file");
    const state = data.get("state");
    const uid = data.get("uid");

    if (!file || !uid || !state) {
      return NextResponse.json(
        { error: "Missing file, state, or user ID" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create storage path
    const filename = `${Date.now()}_${file.name}`;
    const storagePath = `laws/${uid}/${filename}`;

    // Upload using Firebase Admin Storage
    const bucket = getStorage().bucket();
    const uploadedFile = bucket.file(storagePath);

    await uploadedFile.save(buffer, {
      contentType: file.type,
      gzip: true,
    });

    // Get public URL
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Save metadata in Firestore
    await adminDB.collection("lawLibrary").add({
      type: "pdf",
      owner: uid,
      state,
      filename: file.name,
      url,
      storagePath,
      uploadedAt: new Date(),
    });

    return NextResponse.json({ success: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
