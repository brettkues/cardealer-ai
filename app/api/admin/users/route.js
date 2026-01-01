import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserRole } from "@/lib/auth/getUserRole";
import { adminAuth } from "@/lib/firebaseAdmin";

// LIST USERS (ADMIN ONLY)
export async function GET(req) {
  const userId = req.headers.get("x-user-id");

  const role = await getUserRole(userId);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 1️⃣ Get roles (Firebase UID based)
  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (roleError) {
    return NextResponse.json({ users: [] }, { status: 500 });
  }

  // 2️⃣ Get users from Firebase Admin
  const list = await adminAuth.listUsers(1000);
  const firebaseUsers = list.users;

  // 3️⃣ Merge Firebase + roles
  const users = firebaseUsers.map((u) => {
    const roleRow = roleRows.find((r) => r.user_id === u.uid);

    let provider = "password";
    if (u.providerData?.some((p) => p.providerId === "google.com")) {
      provider = "google";
    }

    return {
      user_id: u.uid,
      email: u.email,
      role: roleRow?.role || "sales",
      provider,
      created_at: u.metadata.creationTime,
    };
  });

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
