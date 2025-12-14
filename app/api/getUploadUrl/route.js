import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 🔒 Lazy import so Next.js does NOT execute at build time
    const { Storage } = await import("@google-cloud/storage");

    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });

    const bucket = storage.bucket(process.env.GCP_STORAGE_BUCKET);

    const filename = `generated/${Date.now()}.png`;
    const file = bucket.file(filename);

    // 1-day signed upload URL
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 1000 * 60 * 60 * 24, // 1 day
      contentType: "image/png",
    });

    // 1-day signed read URL (Facebook-safe)
    const [publicUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      contentType: "image/png",
    });
  } catch (err) {
    console.error("SIGNED URL ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
