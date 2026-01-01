import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import admin from "@/lib/firebaseAdmin";

// helper: get role from Firestore
async function getFirestoreUserRole(uid) {
  const snap = await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .get();

  if (!snap.exists) return "user";
  return snap.data()?.role || "user";
}

// LIST USERS (ADMIN ONLY)
export async function GET(req) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔐 ADMIN CHECK — FIRESTORE IS SOURCE OF TRUTH
  const role = await getFirestoreUserRole(userId);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 🔹 Get all Firebase Auth users
  const list = await adminAuth.listUsers(1000);

  // 🔹 Get Firestore roles
  const roleSnaps = await admin.firestore().collection("users").get();
  const roleMap = {};
  roleSnaps.forEach((doc) => {
    roleMap[doc.id] = doc.data();
  });

  // 🔹 Merge
  const users = list.users.map((u) => {
    const fsUser = roleMap[u.uid] || {};
    const provider = u.providerData?.some(p => p.providerId === "google.com")
      ? "google"
      : "password";

    return {
      user_id: u.uid,
      email: u.email,
      role: fsUser.role || "user",
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
  const { userId: targetUid, role } = await req.json();

  const currentRole = await getFirestoreUserRole(userId);
  if (currentRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.firestore().collection("users").doc(targetUid).set(
    { role },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
