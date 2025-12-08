"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";

export default function AuthInit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Required for Google login redirect flow
    getRedirectResult(auth).catch((err) =>
      console.error("Google redirect error:", err)
    );

    const unsub = onAuthStateChanged(auth, () => {
      setReady(true);
    });

    return () => unsub();
  }, []);

  if (!ready) return null;
  return null;
}
