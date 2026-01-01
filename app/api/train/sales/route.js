import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/*
  RESTORED, KNOWN-GOOD UPLOAD ROUTE
  - multipart/form-data
  - direct supabase.storage.upload
  - ingest_jobs insert
  - NO rate logic
  - NO signed URLs
*/

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const form = await req.formData();
    const files = form.getAll("files");

    if (!files.length) {
      return NextResponse.json(
        { ok: false, error: "No files uploaded" },
        { status: 400 }
      );
    }

    let uploaded = 0;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const filePath = `sales-training/${crypto.randomUUID()}-${file.name}`;

      // 1️⃣ Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("knowledge")
        .upload(filePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("STORAGE UPLOAD ERROR:", uploadError.message);
        continue;
      }

      // 2️⃣ Create ingest job
      const { error: jobError } = await supabase
        .from("ingest_jobs")
        .insert({
          file_path: filePath,
          original_name: file.name,
          source: "sales",
          status: "pending",
        });

      if (jobError) {
        console.error("INGEST JOB ERROR:", jobError.message);
        continue;
      }

      uploaded++;
    }

    return NextResponse.json({
      ok: true,
      stored: uploaded,
    });

  } catch (err) {
    console.error("UPLOAD ROUTE ERROR:", err);
    return NextResponse.json(
      { ok: false, error: String(err.message || err) },
      { status: 500 }
    );
  }
}
