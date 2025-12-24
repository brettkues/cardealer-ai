// app/api/train/sales/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { filename, contentType } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { ok: false, error: "Missing filename" },
        { status: 400 }
      );
    }

    const filePath = `sales-training/${crypto.randomUUID()}-${filename}`;

    const { data, error } = await supabase.storage
      .from("knowledge")
      .createSignedUploadUrl(filePath, 600);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const { error: jobError } = await supabase.from("ingest_jobs").insert({
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
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
