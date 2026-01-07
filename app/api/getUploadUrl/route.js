import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { Storage } = await import("@google-cloud/storage");

    const base64 = process.env.GCP_SERVICE_ACCOUNT_BASE64;
    if (!base64) throw new Error("Missing GCP_SERVICE_ACCOUNT_BASE64");

    const credentials = JSON.parse(
      Buffer.from(base64, "base64").toString("utf8")
    );

    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials,
    });

    const bucketName = process.env.GCP_STORAGE_BUCKET;
    if (!bucketName) throw new Error("Missing GCP_STORAGE_BUCKET");

    const bucket = storage.bucket(bucketName);

    const filename = `generated/${Date.now()}.png`;
    const file = bucket.file(filename);

    // ⬆️ upload URL (short-lived)
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 1000 * 60 * 10, // 10 minutes
      contentType: "image/png",
    });

    // ⬇️ read URL (LONG-LIVED for Facebook + site)
    const [publicUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 DAYS
    });

    return NextResponse.json({
      uploadUrl,
      publicUrl,
    });
  } catch (err) {
    console.error("UPLOAD URL ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
