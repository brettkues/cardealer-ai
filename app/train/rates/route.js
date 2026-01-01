import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/* ================= SUPABASE ================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ================= HELPERS ================= */

// Extract lender name from filename
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
  return parts.length ? parts[0].toUpperCase() : "UNKNOWN";
}

/* ================= HANDLER ================= */

export async function POST(req) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { ok: false, error: "Missing filename" },
        { status: 400 }
      );
    }

    const lender = extractLender(filename);

    /* ======================================================
       1️⃣ SUPERSEDE OLD RATE SHEETS (LOGICAL REPLACEMENT)
       ====================================================== */

    await supabase
      .from("ingest_jobs")
      .update({ status: "superseded" })
      .eq("source", "sales")
      .eq("doc_type", "RATE_SHEET")
      .eq("lender", lender)
      .neq("status", "superseded");

    /* ======================================================
       2️⃣ CREATE NEW STORAGE OBJECT (NEVER OVERWRITE)
       ====================================================== */

    const filePath = `rate-sheets/${crypto.randomUUID()}-${filename}`;

    const { data, error: uploadError } = await supabase.storage
      .from("knowledge")
      .createSignedUploadUrl(filePath, 600);

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 }
      );
    }

    /* ======================================================
       3️⃣ REGISTER INGEST JOB (THIS IS THE SOURCE OF TRUTH)
       ====================================================== */

    const { error: jobError } = await supabase.from("ingest_jobs").insert({
      file_path: filePath,
      original_name: filename,
      source: "sales",
      status: "pending",
      doc_type: "RATE_SHEET",
      lender,
      metadata: {
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

    /* ======================================================
       4️⃣ RETURN SIGNED UPLOAD URL
       ====================================================== */

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
