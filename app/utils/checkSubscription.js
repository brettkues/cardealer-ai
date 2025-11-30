import { auth, db } from "@/app/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function watchSubscription(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ loggedIn: false });
      return;
    }

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      callback({ loggedIn: true, active: false });
      return;
    }

    const data = snap.data();
    const now = new Date();

    // Check trial expiration
    let trialValid = false;
    if (data.trialEnds) {
      const trialEnd = new Date(data.trialEnds);
      trialValid = now <= trialEnd;
    }

    callback({
      loggedIn: true,
      role: data.role || "user",
      active:
        data.role === "admin" ||
        data.subscriptionActive === true ||
        trialValid,
      subscriptionSource: data.subscriptionSource || null,
      trialEnds: data.trialEnds || null,
    });
  });
}
