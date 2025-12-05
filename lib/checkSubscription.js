import { adminDB } from "@/lib/firebaseAdmin";

export async function checkSubscription(uid) {
  if (!uid) return false;

  try {
    const docSnap = await adminDB.collection("users").doc(uid).get();

    if (!docSnap.exists) return false;

    const data = docSnap.data();

    return data.subscribed === true;
  } catch (err) {
    console.error("Subscription check failed:", err);
    return false;
  }
}
