import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserRole } from "@/lib/auth/getUserRole";

// LIST USERS (ADMIN ONLY)
export async function GET(req) {
  const userId = req.headers.get("x-user-id");

  const role = await getUserRole(userId);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .order("user_id");

  if (error) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

// UPDATE ROLE (ADMIN ONLY)
export async function POST(req) {
  const userId = req.headers.get("x-user-id");

  const role = await getUserRole(userId);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId: targetUserId, role: newRole } = await req.json();

  if (!targetUserId || !newRole) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: targetUserId,
        role: newRole,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ ok: true });
}
