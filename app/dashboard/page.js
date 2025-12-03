"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// RELATIVE PATH — SAFE FOR VERCEL
import { checkSubscription } from "../utils/checkSubscription";

// RELATIVE PATH — SAFE FOR VERCEL
import { auth } from "../firebase";

export default function DashboardPage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);

  // -------------------------------------------
  // LOGIN + SUBSCRIPTION CHECK
  // -------------------------------------------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const active = await checkSubscription(user.uid);

      if (!active) {
        router.push("/subscribe");
        return;
      }

      setSub({
        loggedIn: true,
        active,
        uid: user.uid,
      });
    });

    return () => unsub();
  }, [router]);

  if (!sub) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking subscription…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4 text-gray-300">
        Your subscription is active.
      </p>
    </div>
  );
}
