import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    const { id, image_url, vehicle_url } = body;

    if (!id || !image_url || !vehicle_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("image_shares")
      .insert({
        id,
        image_url,
        vehicle_url,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("saveImage error:", err);
    return NextResponse.json(
      { error: err.message || "saveImage failed" },
      { status: 500 }
    );
  }
}
