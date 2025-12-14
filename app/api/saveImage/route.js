import { NextResponse } from "next/server";
import admin from "firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Init Firebase Admin once
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

    // ✅ Use explicit write stream (serverless-safe)
    await new Promise((resolve, reject) => {
      const stream = file.createWriteStream({
        contentType: "image/png",
        resumable: false,
        validation: false,
      });

      stream.on("error", reject);
      stream.on("finish", resolve);
      stream.end(buffer);
    });

    // ✅ Signed URL (no public ACLs needed)
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
