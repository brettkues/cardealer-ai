import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const filename = `generated/${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from("image-shares")
      .createSignedUploadUrl(filename);

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from("image-shares")
      .getPublicUrl(filename);

    return NextResponse.json({
      uploadUrl: data.signedUrl,
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
