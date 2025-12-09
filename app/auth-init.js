"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";

export default function AuthInit() {
  useEffect(() => {
    // Expose Firebase Auth globally for debugging & redirect session handling
    window.firebaseAuth = auth;

    // Handle Google redirect login result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Google redirect complete:", result.user.email);
          window.location.href = "/dashboard"; // force navigation
        }
      })
      .catch((err) => {
        console.error("Redirect error:", err);
      });

    // Ensure Firebase session is hydrated on page load
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User session detected:", user.email);
      } else {
        console.log("No user session detected");
      }
    });
  }, []);

  return null;
}
