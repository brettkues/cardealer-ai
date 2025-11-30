import { auth, db } from "@/app/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

/**
 * watchSubscription(callback)
 *
 * Monitors:
 *  - Firebase auth login state
 *  - Dealer’s subscription status
 *  - Free trial / promo code accounts
 *  - Admin override accounts
 *
 * Returns:
 *  {
 *    loggedIn: true/false,
 *    active: true/false,
 *    uid: "abc123",
 *    role: "admin" | "dealer",
 *    subscriptionSource: "stripe" | "admin" | "promo" | "freeTrial",
 *  }
 */

export function watchSubscription(callback) {
  let unsubFirestore = null;

  const unsubAuth = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({
        loggedIn: false,
        active: false,
        uid: null,
        role: null,
        subscriptionSource: null,
      });

      if (unsubFirestore) unsubFirestore();
      return;
    }

    const uid = user.uid;

    // LIVE subscription listener
    unsubFirestore = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (!snap.exists()) {
          callback({
            loggedIn: true,
            active: false,
            uid,
            role: null,
            subscriptionSource: null,
          });
          return;
        }

        const data = snap.data();

        callback({
          loggedIn: true,
          uid,
          role: data.role || "dealer",
          active: !!data.subscriptionActive,
          subscriptionSource: data.subscriptionSource || "unknown",
        });
      },
      (err) => {
        console.error("Subscription check error:", err);

        callback({
          loggedIn: true,
          active: false,
          uid,
          role: null,
          subscriptionSource: null,
        });
      }
    );
  });

  return () => {
    unsubAuth();
    if (unsubFirestore) unsubFirestore();
  };
}
