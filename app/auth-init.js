"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";

export default function AuthInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Fix redirect flow for Google popup/popup-close
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect result error:", err);
    });

    // Ensure Firebase session hydrates BEFORE apps loads
    const unsub = onAuthStateChanged(auth, () => {
      setInitialized(true);
    });

    return () => unsub();
  }, []);

  // Prevent the app from rendering before auth is ready
  if (!initialized) return null;

  return null;
}
