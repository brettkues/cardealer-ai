"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";

export default function AuthInit() {
  useEffect(() => {
    // Capture redirect result (Google login flow sometimes uses this internally)
    getRedirectResult(auth).catch((err) =>
      console.error("Google redirect handler error:", err)
    );

    // Make sure Firebase session loads before app renders
    const unsub = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user?.email || "not logged in");
    });

    return () => unsub();
  }, []);

  return null;
}
