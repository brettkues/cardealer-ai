"use client";

import { useEffect, useState } from "react";
import { auth } from "@/app/firebase";
import { checkSubscription } from "@/app/utils/checkSubscription";

export default function DashboardPage() {
  const [uid, setUid] = useState(null);
  const [subscribed, setSubscribed] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        const active = await checkSubscription(user.uid);
        setSubscribed(active);
      } else {
        setUid(null);
        setSubscribed(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (subscribed === null) return <div>Loading...</div>;

  if (!subscribed)
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Subscription Required</h1>
        <p className="mt-4 text-gray-600">
          Your subscription is not active. Please update your billing info.
        </p>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome to your dealer dashboard.</p>
    </div>
  );
}
