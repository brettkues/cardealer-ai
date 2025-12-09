"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";

export default function AuthInit() {
  useEffect(() => {
    // Handle redirect login from Google
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Google redirect complete:", result.user.email);
          window.location.href = "/dashboard"; // FORCE forward navigation
        }
      })
      .catch((err) => {
        console.error("Redirect error:", err);
      });

    // Hydrate Firebase session
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User session detected:", user.email);
      }
    });
  }, []);

  return null;
}
