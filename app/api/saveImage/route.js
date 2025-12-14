import { NextResponse } from "next/server";
import admin from "firebase-admin";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔐 Initialize Firebase Admin ONCE
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: Buffer
        .from(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64, "base64")
        .toString("utf8"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image || !image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Decode base64 image
    const base64 = image.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    // Write to temp file (serverless-safe)
    const filename = `generated-${Date.now()}.png`;
    const tempPath = path.join(os.tmpdir(), filename);

    await fs.writeFile(tempPath, buffer);

    // Upload to Firebase Storage (NO STREAMS)
    const destination = `generated/${filename}`;

    await bucket.upload(tempPath, {
      destination,
      contentType: "image/png",
      resumable: false,
      validation: false,
    });

    // Cleanup temp file
    await fs.unlink(tempPath);

    // Generate signed URL (Facebook-safe)
    const file = bucket.file(destination);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ url });

  } catch (err) {
    console.error("SAVE IMAGE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save image" },
      { status: 500 }
    );
  }
}
