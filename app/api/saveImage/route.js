import { NextResponse } from "next/server";
import admin from "firebase-admin";

export const runtime = "nodejs";

if (!admin.apps.length) {
  console.log("INIT ADMIN WITH:");
  console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("CLIENT_EMAIL:", process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  console.log("BUCKET ENV:", process.env.FIREBASE_STORAGE_BUCKET);

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
    console.log("USING BUCKET:", bucket?.name);

    const { image } = await req.json();

    const base64 = image.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const filename = `generated/${Date.now()}.png`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      contentType: "image/png",
      resumable: false,
    });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24,
    });

    return NextResponse.json({ url });

  } catch (err) {
    console.error("🔥 FINAL SAVE ERROR 🔥", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}
