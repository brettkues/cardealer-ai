// /app/utils/checkSubscription.js

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/firebase";

// Watches login state + subscription status for dashboard pages
export function watchSubscription(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({
        loggedIn: false,
        active: false,
        subscriptionSource: null,
        uid: null,
      });
      return;
    }

    // User logged in — pull subscription record
    const subRef = doc(db, "subscriptions", user.uid);
    const subSnap = await getDoc(subRef);

    if (subSnap.exists()) {
      const data = subSnap.data();

      callback({
        loggedIn: true,
        active: data.active ?? false,
        subscriptionSource: data.source ?? null,
        uid: user.uid,
      });
    } else {
      callback({
        loggedIn: true,
        active: false,
        subscriptionSource: null,
