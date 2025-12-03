"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// RELATIVE IMPORT — REQUIRED FOR VERCEL
import { watchSubscription } from "../utils/checkSubscription";

export default function SubscribePage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);

  useEffect(() => {
    const unsub = watchSubscription((status) => {
      if (!status.loggedIn) {
        router.push("/login");
        return;
      }

      // If sub already active → redirect to dashboard
      if (status.active) {
        router.push("/dashboard");
        return;
      }

      setSub(status);
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

  const handleSubscribe = () => {
    router.push("/subscribe/payment");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-xl max-w-md w-full">

        <h1 className="text-3xl font-bold text-center mb-6">
          Activate Your Subscription
        </h1>

        <p className="text-gray-300 mb-6 text-center">
          Your account is created, but you must activate a subscription to use the Dealer AI platform.
        </p>

        <button
          onClick={handleSubscribe}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-semibold"
        >
          View Subscription Options
        </button>

        <p
          className="mt-6 text-blue-400 text-center cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          Already subscribed? Refresh your status.
        </p>
      </div>
    </div>
  );
}
