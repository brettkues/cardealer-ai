import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // REQUIRED – DO NOT REMOVE

export async function POST(req) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured (Supabase env missing)" },
        { status: 500 }
      );
    }

    // 🔑 Service-role client (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const form = await req.formData();
    const files = form.getAll("files");

    if (!files.length) {
      return NextResponse.json(
        { ok: false, error: "No files received" },
        { status: 400 }
      );
    }

    let uploaded = 0;

    for (const file of files) {
      const path = `sales-training/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("knowledge")
        .upload(path, file, {
          contentType: file.type || "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("STORAGE ERROR:", uploadError.message);
        continue;
      }

      const { error: jobError } = await supabase
        .from("ingest_jobs")
        .insert({
          file_path: path,
          original_name: file.name,
          source: "sales",
          status: "pending",
        });

      if (jobError) {
        console.error("JOB INSERT ERROR:", jobError.message);
        continue;
      }

      uploaded++;
    }

    return NextResponse.json({ ok: true, stored: uploaded });
  } catch (err) {
    console.error("UPLOAD ROUTE FAILURE:", err);
    return NextResponse.json(
      { ok: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}
