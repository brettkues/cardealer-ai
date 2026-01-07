import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { filename } = params;

    if (!filename) {
      return new NextResponse("Not found", { status: 404 });
    }

    // 🔹 READ FROM GCS (same bucket you already use)
    const { Storage } = await import("@google-cloud/storage");

    const credentials = JSON.parse(
      Buffer.from(process.env.GCP_SERVICE_ACCOUNT_BASE64, "base64").toString(
        "utf8"
      )
    );

    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials,
    });

    const bucket = storage.bucket(process.env.GCP_STORAGE_BUCKET);
    const file = bucket.file(`generated/${filename}`);

    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse("Not found", { status: 404 });
    }

    const [buffer] = await file.download();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("SHARED IMAGE ERROR:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
