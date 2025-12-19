import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  const { userId, email } = await req.json();

  if (!userId || !email) {
    return NextResponse.json({ ok: false });
  }

  // Check if role already exists
  const { data } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (!data) {
    // New user → create with default role
    await supabase.from("user_roles").insert({
      user_id: userId,
      email,
      role: "sales",
    });
  } else {
    // Existing user → keep email updated
    await supabase
      .from("user_roles")
      .update({ email })
      .eq("user_id", userId);
  }

  return NextResponse.json({ ok: true });
}
