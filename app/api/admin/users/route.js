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

  // 1️⃣ Get roles from DB
  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (roleError) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }

  // 2️⃣ Get users from Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.admin.listUsers();

  if (authError) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }

  const authUsers = authData.users || [];

  // 3️⃣ Merge auth + roles
  const users = authUsers.map((u) => {
    const roleRow = roleRows.find((r) => r.user_id === u.id);

    return {
      user_id: u.id,
      email: u.email,
      role: roleRow?.role || "sales",
      provider: u.app_metadata?.provider || "password",
      created_at: u.created_at,
    };
  });

  // Optional: stable sort by email
  users.sort((a, b) => (a.email || "").localeCompare(b.email || ""));

  return NextResponse.json({ users });
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
