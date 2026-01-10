import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    const bucketName = process.env.SUPABASE_IMAGE_BUCKET || "image-shares";
    const filename = `generated/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.png`;

    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(filename, 60 * 10);

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      publicUrl: publicData.publicUrl,
    });
  } catch (err) {
    console.error("UPLOAD URL ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
