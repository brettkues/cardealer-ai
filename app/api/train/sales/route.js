import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

/*
  SALES DOCUMENT UPLOAD INIT
  - Creates signed upload URL
  - Inserts ingest_jobs row
  - NOTHING ELSE
*/

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json();
    const filename = body?.filename;
    const contentType = body?.contentType;

    if (!filename) {
      return NextResponse.json(
        { ok: false, error: "Missing filename" },
        { status: 400 }
      );
    }

    const filePath = `sales-training/${randomUUID()}-${filename}`;

    const { data, error } = await supabase.storage
      .from("knowledge")
      .createSignedUploadUrl(filePath, { expiresIn: 600 });

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Failed to create upload URL" },
        { status: 500 }
      );
    }

    const { error: jobError } = await supabase
      .from("ingest_jobs")
      .insert({
        file_path: filePath,
        original_name: filename,
        source: "sales",
        doc_type: "DOCUMENT",
        status: "pending",
        metadata: {
          uploaded_via: "train_ui",
        },
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
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
