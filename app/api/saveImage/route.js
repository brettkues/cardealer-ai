import { NextResponse } from "next/server";
import admin from "firebase-admin";

export const runtime = "nodejs";

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
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

    const base64 = image.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const filename = `generated/${Date.now()}.png`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType: "image/png",
        cacheControl: "public, max-age=31536000",
      },
      public: true,
      resumable: false,
      validation: false,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return NextResponse.json({ url: publicUrl });

  } catch (err) {
    console.error("SAVE IMAGE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}
