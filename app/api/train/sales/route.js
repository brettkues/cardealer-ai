// app/api/train/sales/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/* ================= HELPERS ================= */

// Very conservative lender detection (expand later)
function detectLender(filename = "") {
  const name = filename.toLowerCase();

  if (name.includes("altra")) return "ALTRA";
  if (name.includes("chase")) return "CHASE";
  if (name.includes("ally")) return "ALLY";
  if (name.includes("capital one")) return "CAPITAL_ONE";

  return null;
}

function detectDocType(filename = "") {
  const name = filename.toLowerCase();

  if (name.includes("rate")) return "RATE_SHEET";
  if (name.includes("rates")) return "RATE_SHEET";

  return "POLICY";
}

/* ================= HANDLER ================= */

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

    /* ===== CLASSIFICATION ===== */

    const docType = detectDocType(filename);
    const lender = docType === "RATE_SHEET" ? detectLender(filename) : null;

    /* ===== RATE SHEET REPLACEMENT ===== */

    if (docType === "RATE_SHEET" && lender) {
      // Mark prior rate sheets for same lender as superseded
      await supabase
        .from("ingest_jobs")
        .update({ status: "superseded" })
        .eq("source", "sales")
        .eq("doc_type", "RATE_SHEET")
        .eq("lender", lender)
        .neq("status", "superseded");
    }

    /* ===== STORAGE UPLOAD ===== */

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

    /* ===== INGEST JOB RECORD ===== */

    const { error: jobError } = await supabase.from("ingest_jobs").insert({
      file_path: filePath,
      original_name: filename,
      source: "sales",
      status: "pending",

      // 🔽 NEW (read-only metadata for Phase 3)
      doc_type: docType,
      lender,
      metadata: {
        doc_type: docType,
        lender,
        uploaded_by: "ui",
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
