// SERVER-ONLY SUBSCRIPTION CHECK

import { adminDB } from "@/lib/firebaseAdmin";

export async function checkSubscription(uid) {
  if (!uid) return false;

  try {
    const snap = await adminDB.collection("users").doc(uid).get();

    if (!snap.exists) return false;

    const data = snap.data();

    return data.subscribed === true;
  } catch (err) {
    console.error("Subscription check failed:", err);
    return false;
  }
}
