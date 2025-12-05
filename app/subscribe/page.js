"use client";

import { useEffect, useState } from "react";

export default function SubscribePage() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Load session
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();

      if (!data.loggedIn || !data.uid) {
        window.location.href = "/login";
        return;
      }

      setUid(data.uid);

      // Check if already subscribed
      const subRes = await fetch("/api/subscription", {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({ uid: data.uid }),
      });

      const subData = await subRes.json();

      if (subData.active) {
        window.location.href = "/dashboard";
        return;
      }

      setLoading(false);
    }

    load();
  }, []);

  // 2. Create Checkout Session
  async function subscribe() {
    if (!uid) return;

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({
        uid,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error starting checkout: " + (data.error || "Unknown error"));
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center text-white">
        Checking subscription…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-10">
      <h1 className="text-3xl font-bold mb-6">Subscribe</h1>
      <p className="text-gray-300 mb-8 text-center max-w-md">
        Unlock full access to your dealer tools with a monthly subscription.
      </p>

      <button
        onClick={subscribe}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
      >
        Start Subscription
      </button>
    </div>
  );
}
