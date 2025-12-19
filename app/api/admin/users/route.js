import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserRole } from "@/lib/auth/getUserRole";

export async function GET(req) {
  // TODO: add admin check when auth context is wired
  const { data } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .order("user_id");

  return NextResponse.json({ users: data || [] });
}

export async function POST(req) {
  const { userId, role } = await req.json();

  if (!userId || !role) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await supabase
    .from("user_roles")
    .upsert(
      { user_id: userId, role, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ ok: true });
}
