import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { filename, contentType } = await req.json();
  if (!filename) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const filePath = `sales-training/${crypto.randomUUID()}-${filename}`;

  const { data, error } = await supabase.storage
    .from("knowledge")
    .createSignedUploadUrl(filePath, 600);

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    uploadUrl: data.signedUrl,
    filePath,
    contentType: contentType || "application/octet-stream",
  });
}
