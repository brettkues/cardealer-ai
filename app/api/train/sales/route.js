import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

/**
 * STEP 1 ONLY
 * - Upload raw files to Supabase Storage
 * - Create pending ingest_jobs rows
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

    if (!files || files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No files received" },
        { status: 400 }
      );
    }

    let uploaded = 0;

    for (const file of files) {
      console.log("UPLOAD:", file.name, "SIZE:", file.size);

      const filePath = `sales-training/${crypto.randomUUID()}-${file.name}`;

      // 1️⃣ Upload raw file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("knowledge")
        .upload(filePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("STORAGE UPLOAD ERROR:", uploadError);
        continue;
      }

      // 2️⃣ Create ingestion job
      const { error: jobError } = await supabase
        .from("ingest_jobs")
        .insert({
          file_path: filePath,
          original_name: file.name,
          source: "sales",
          status: "pending",
        });

      if (jobError) {
        console.error("INGEST JOB ERROR:", jobError);
        continue;
      }

      uploaded++;
    }

    // UI expects `stored`
    return NextResponse.json({
      ok: true,
      stored: uploaded,
    });

  } catch (err) {
    console.error("UPLOAD ROUTE ERROR:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
