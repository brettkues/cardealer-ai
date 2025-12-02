// app/utils/checkSubscription.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const checkSubscription = async (userId) => {
  if (!userId) return false;

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.subscriptionActive === true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
};
