import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// LIST USERS + ROLES
export async function GET() {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .order("user_id");

  if (error) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

// UPDATE USER ROLE
export async function POST(req) {
  const { userId, role } = await req.json();

  if (!userId || !role) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: userId,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
