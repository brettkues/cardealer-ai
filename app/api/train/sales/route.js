// app/api/train/sales/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/*
  SIGNED UPLOAD ROUTE (NO VERCEL SIZE LIMITS)
  - Browser uploads directly to Supabase Storage
  - API only creates signed URL + ingest job
  - ingestion-worker remains unchanged
*/

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { filename, contentType } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { ok: false, error: "Missing filename" },
        { status: 400 }
      );
    }

    // unique storage path
    const filePath = `sales-training/${crypto.randomUUID()}-${filename}`;

    // 1️⃣ create signed upload URL (browser uploads file directly)
    const { data, error } = await supabase.storage
      .from("knowledge")
      .createSignedUploadUrl(filePath, 600);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // 2️⃣ register ingest job (worker will pick this up)
    const { error: jobError } = await supabase
      .from("ingest_jobs")
      .insert({
        file_path: filePath,
        original_name: filename,
        source: "sales",
        status: "pending",
      });

    if (jobError) {
      return NextResponse.json(
        { ok: false, error: jobError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      uploadUrl: data.signedUrl,
      contentType: contentType || "application/octet-stream",
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err.message || err) },
      { status: 500 }
    );
  }
}
