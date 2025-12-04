// app/utils/checkSubscription.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";   // ← FIXED PATH

export const checkSubscription = async (userId) => {
  if (!userId) return false;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return false;

    const data = userSnap.data();
    return data.subscriptionActive === true;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
};
