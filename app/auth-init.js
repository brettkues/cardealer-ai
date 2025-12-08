"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";

export default function AuthInit() {
  useEffect(() => {
    // Handle Google redirect login
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Google redirect login complete:", result.user);
          window.location.href = "/dashboard"; // force redirect
        }
      })
      .catch((err) => {
        console.error("Redirect result error:", err);
      });

    // Ensure Firebase initializes before app renders
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) console.log("Firebase user session loaded:", user.email);
    });

    return () => unsub();
  }, []);

  return null;
}
