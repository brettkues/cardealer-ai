import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 🔍 HARD PROOF LOGGING
    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log(
      "SERVICE KEY prefix:",
      serviceKey ? serviceKey.slice(0, 10) : "MISSING"
    );

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const form = await req.formData();
    const files = form.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No files received" },
        { status: 400 }
      );
    }

    for (const file of files) {
      const filePath = `sales-training/${crypto.randomUUID()}-${file.name}`;

      const { error } = await supabase.storage
        .from("knowledge")
        .upload(filePath, file, { upsert: false });

      if (error) {
        console.error("UPLOAD ERROR:", error);
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 403 }
        );
      }

      await supabase.from("ingest_jobs").insert({
        file_path: filePath,
        original_name: file.name,
        source: "sales",
        status: "pending",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ROUTE FAILURE:", err);
    return NextResponse.json(
      { ok: false, error: "Route crashed" },
      { status: 500 }
    );
  }
}
