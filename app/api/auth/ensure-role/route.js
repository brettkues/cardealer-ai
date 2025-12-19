import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ ok: false });
  }

  // Check if role already exists
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  // If no role, assign default "sales"
  if (!data) {
    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "sales",
    });
  }

  return NextResponse.json({ ok: true });
}
