"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function LogoutPage() {
  useEffect(() => {
    const doLogout = async () => {
      try {
        await signOut(auth);

        // Clear Firebase session artifacts
        localStorage.removeItem("firebase:authUser");
        localStorage.removeItem("firebase:redirectOutcome");
        localStorage.removeItem("firebase:previousWebStorage");

        window.location.href = "/auth/login";
      } catch (err) {
        console.error("Logout error:", err);
      }
    };

    doLogout();
  }, []);

  return null;
}
