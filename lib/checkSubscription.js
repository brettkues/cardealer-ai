// SAFE UNIVERSAL SUBSCRIPTION CHECK
// This file NEVER imports firebase-admin at the top.
// It loads admin ONLY when running in a server environment.

import { db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

// Detect server environment
function isServer() {
  return typeof window === "undefined";
}

export async function checkSubscription(uid) {
  if (!uid) return false;

  // ---------- SERVER (API routes / server components) ----------
  if (isServer()) {
    try {
      // Dynamically import admin ONLY when used on server
      const { adminDB } = await import("@/lib/firebaseAdmin");
      const snap = await adminDB.collection("users").doc(uid).get();

      if (!snap.exists) return false;
      const data = snap.data();
      return data.subscribed === true;
    } catch (err) {
      console.error("Admin subscription check error:", err);
      return false;
    }
  }

  // ---------- CLIENT (React pages) ----------
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return false;
    const data = snap.data();
    return data.subscribed === true;
  } catch (err) {
    console.error("Client subscription check error:", err);
    return false;
  }
}
