import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const form = await req.formData();
    const files = form.getAll("files");
    if (!files.length) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let uploaded = 0;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // 🔒 supersede older rate sheets with same filename
      await supabase
        .from("ingest_jobs")
        .update({ status: "superseded" })
        .ilike("original_name", file.name)
        .neq("status", "superseded");

      const filePath = `rate-sheets/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("knowledge")
        .upload(filePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) continue;

      await supabase.from("ingest_jobs").insert({
        file_path: filePath,
        original_name: file.name,
        source: "sales",
        status: "pending",
      });

      uploaded++;
    }

    return NextResponse.json({ ok: true, stored: uploaded });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
