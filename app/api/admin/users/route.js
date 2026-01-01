export const runtime = "nodejs";

import { NextResponse } from "next/server";
import admin, { adminAuth, adminDb } from "@/lib/firebaseAdmin";

// helper: get role from Firestore safely
async function getFirestoreUserRole(uid) {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return "user";
  return snap.data()?.role || "user";
}

// LIST USERS (ADMIN ONLY)
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getFirestoreUserRole(userId);
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const list = await adminAuth.listUsers(1000);
    const roleSnaps = await adminDb.collection("users").get();

    const roleMap = {};
    roleSnaps.forEach((doc) => {
      roleMap[doc.id] = doc.data();
    });

    const users = list.users.map((u) => {
      const fsUser = roleMap[u.uid] || {};
      const provider = u.providerData?.some(
        (p) => p.providerId === "google.com"
      )
        ? "google"
        : "password";

      return {
        user_id: u.uid,
        email: u.email || "",
        role: fsUser.role || "user",
        provider,
        created_at: u.metadata.creationTime,
      };
    });

    users.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
    return NextResponse.json({ users });

  } catch (err) {
    console.error("ADMIN USERS FAILED:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE ROLE (ADMIN ONLY)
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { userId: targetUid, role } = await req.json();

    const currentRole = await getFirestoreUserRole(userId);
    if (currentRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await adminDb.collection("users").doc(targetUid).set(
      { role },
      { merge: true }
    );

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("ADMIN ROLE UPDATE FAILED:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
