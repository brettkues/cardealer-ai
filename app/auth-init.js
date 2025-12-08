"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AuthInit() {
  useEffect(() => {
    // Ensure Firebase persists the session across reloads
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("AuthInit: user restored", user.uid);
        window.firebaseUser = user;
      } else {
        console.log("AuthInit: no user");
        window.firebaseUser = null;
      }
    });
  }, []);

  return null;
}

