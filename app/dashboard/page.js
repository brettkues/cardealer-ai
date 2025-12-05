"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    async function verify() {
      // 1. Check login session
      const sessionRes = await fetch("/api/session/me");
      const session = await sessionRes.json();

      if (!session.uid) {
        router.push("/login");
        return;
      }

      // 2. Check subscription
      const subRes = await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ uid: session.uid }),
      });
      const sub = await subRes.json();

      if (!sub.active) {
        router.push("/subscribe");
        return;
      }

      setUid(session.uid);
      setChecking(false);
    }

    verify();
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-300">Welcome! Your subscription is active.</p>
    </div>
  );
}
