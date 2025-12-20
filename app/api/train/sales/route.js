import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

/**
 * STEP 1 ONLY:
 * - Upload files to Supabase Storage
 * - Create a pending ingestion job
 * - Return immediately
 *
 * NO parsing
 * NO chunking
 * NO embeddings
 */

export async function POST(req) {
  try {
    const form = await req.formData();
    const files = form.getAll("files");

    if (!files.length) {
      return NextResponse.json({ ok: false, error: "No files received" }, { status: 400 });
    }

    let uploaded = 0;

    for (const file of files) {
      const filePath = `sales-training/${crypto.randomUUID()}-${file.name}`;

      // 1️⃣ Upload raw file to storage
      const { error: uploadError } = await supabase.storage
        .from("knowledge")
        .upload(filePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("UPLOAD ERROR:", uploadError);
        continue;
      }

      // 2️⃣ Create pending ingestion job
      const { error: jobError } = await supabase
        .from("ingest_jobs")
        .insert({
          file_path: filePath,
          original_name: file.name,
          status: "pending",
          source: "sales",
        });

      if (jobError) {
        console.error("JOB INSERT ERROR:", jobError);
        continue;
      }

      uploaded++;
    }

    return NextResponse.json({
      ok: true,
      uploaded,
      message: "Files uploaded. Ingestion queued.",
    });

  } catch (err) {
    console.error("UPLOAD ROUTE ERROR:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
