"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function LogoutPage() {
  useEffect(() => {
    const doLogout = async () => {
      try {
        // FIRST: sign out of Firebase
        await signOut(auth);

        // IMPORTANT:
        // Only clear the persistent login state,
        // NOT redirect metadata needed for Google login.
        localStorage.removeItem("firebase:authUser");

        // DO NOT REMOVE:
        // firebase:redirectOutcome
        // firebase:previousWebStorage
        // (Deleting these breaks Google login)

        window.location.href = "/auth/login";
      } catch (err) {
        console.error("Logout error:", err);
      }
    };

    doLogout();
  }, []);

  return null;
}
