import { NextResponse } from "next/server";
import admin from "firebase-admin";

export const runtime = "nodejs";

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
    console.log("DEBUG bucket:", bucket?.name);
    console.log("DEBUG project:", process.env.FIREBASE_PROJECT_ID);

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image received" }, { status: 400 });
    }

    const base64 = image.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const filename = `generated/${Date.now()}.png`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      contentType: "image/png",
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return NextResponse.json({ url: publicUrl });

  } catch (err) {
    console.error("🔥 FIREBASE SAVE ERROR 🔥", err);
    return NextResponse.json(
      {
        error: "Failed to save image",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
