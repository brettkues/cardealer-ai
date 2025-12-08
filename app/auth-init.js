"use client";

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { getRedirectResult } from "firebase/auth";

export default function AuthInit() {
  useEffect(() => {
    getRedirectResult(auth).catch((err) =>
      console.error("Redirect result error:", err)
    );
  }, []);

  return null;
}
