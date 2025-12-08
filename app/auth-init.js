"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";

export default function AuthInit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Process Google redirect result ONCE
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Google redirect complete:", result.user.email);
        }
      })
      .catch((err) => console.error("Redirect error:", err));

    // Wait for Firebase to hydrate the session
    const unsub = onAuthStateChanged(auth, () => {
      setReady(true);
    });

    return () => unsub();
  }, []);

  // Prevent rendering until auth is initialized
  if (!ready) return null;

  return null;
}
