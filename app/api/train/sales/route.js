// app/api/train/sales/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/* ================= HELPERS ================= */

// Detect document type by intent, not brand
function detectDocType(filename = "") {
  const name = filename.toLowerCase();
  if (name.includes("rate")) return "RATE_SHEET";
  return "POLICY";
}

// Extract lender name heuristically from filename
function extractLender(filename = "") {
  const cleaned = filename
    .toLowerCase()
    .replace(/\.(pdf|docx?|xlsx?)$/i, "")
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stopWords = [
    "rate",
    "rates",
    "sheet",
    "program",
    "auto",
    "finance",
    "fi",
    "retail",
    "dealer",
    "lending",
    "credit",
    "union",
  ];

  const parts = cleaned.split(" ").filter(p => !stopWords.includes(p));

  if (!parts.length) return "UNKNOWN";

  return parts[0].toUpperCase();
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
    const lender =
      docType === "RATE_SHEET" ? extractLender(filename) : null;

    /* ===== RATE SHEET REPLACEMENT (BY FILENAME) ===== */

    if (docType === "RATE_SHEET") {
      await supabase
        .from("ingest_jobs")
        .update({ status: "superseded" })
        .eq("source", "sales")
        .eq("doc_type", "RATE_SHEET")
        .eq("original_name", filename)
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
