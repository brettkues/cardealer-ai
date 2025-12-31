// app/api/train/sales/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/* ================= HELPERS ================= */

function detectDocType(filename = "") {
  const name = filename.toLowerCase();
  if (name.includes("rate")) return "RATE_SHEET";
  return "POLICY";
}

/**
 * Attempt to derive lender name from filename.
 * Returns UPPER_SNAKE_CASE string or null if unclear.
 */
function deriveLender(filename = "") {
  const base = filename
    .replace(/\.[^/.]+$/, "")       // strip extension
    .replace(/rates?/gi, "")        // remove "rate" / "rates"
    .replace(/sheet/gi, "")
    .replace(/finance/gi, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim();

  if (!base) return null;

  // Take first meaningful word group
  const parts = base.split(/\s+/).slice(0, 2);
  return parts.join("_").toUpperCase();
}

function buildTaggedName(filename, docType, lender) {
  let prefix = `[${docType}]`;
  if (lender) prefix += `[LENDER:${lender}]`;
  return `${prefix} ${filename}`;
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
    const lender = docType === "RATE_SHEET" ? deriveLender(filename) : null;
    const taggedName = buildTaggedName(filename, docType, lender);

    /* ===== RATE SHEET REPLACEMENT ===== */

    if (docType === "RATE_SHEET" && lender) {
      await supabase
        .from("ingest_jobs")
        .update({ status: "superseded" })
        .eq("source", "sales")
        .ilike("original_name", `[RATE_SHEET][LENDER:${lender}]%`)
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
      original_name: taggedName,
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
