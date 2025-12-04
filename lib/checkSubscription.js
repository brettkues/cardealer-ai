import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function checkSubscription(uid) {
  if (!uid) return false;

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return false;

  const data = snap.data();

  return data.subscribed === true;
}
