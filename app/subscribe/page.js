"use client";

import { useEffect, useState } from "react";
import { watchSubscription } from "@/app/utils/checkSubscription";
import { useRouter } from "next/navigation";

export default function SubscribePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [promo, setPromo] = useState("");
  const [error, setError] = useState("");
  const [subInfo, setSubInfo] = useState(null);

  // ---------------------------------------------
  // WATCH LOGIN + SUBSCRIPTION STATE
  // ---------------------------------------------
  useEffect(() => {
    const unsub = watchSubscription((status) => {
      setSubInfo(status);

      if (!status.loggedIn) return router.push("/login");

      if (status.active) {
        // Already subscribed
        router.push("/ai");
      }
    });

    return () => unsub();
  }, []);

  if (!subInfo) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading account…
      </div>
    );
  }

  // ---------------------------------------------
  // APPLY PROMO CODE (dealerpass)
  // ---------------------------------------------
  const applyPromo = async () => {
    setError("");

    if (promo.trim().toLowerCase() !== "dealerpass") {
      setError("Invalid promo code.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/promo", {
        method: "POST",
        body: JSON.stringify({ uid: subInfo.uid, code: promo }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Promo activates subscription instantly
      router.push("/ai");
    } catch (err) {
      setError("Unable to apply promo code.");
    }

    setLoading(false);
  };

  // ---------------------------------------------
  // START STRIPE CHECKOUT
  // ---------------------------------------------
  const startCheckout = async (plan) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          uid: subInfo.uid,
          plan, // "monthly" or "annual"
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err) {
      setError("Checkout failed. Try again.");
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // UI
  // ---------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-6 py-10">

      <h1 className="text-4xl font-bold mb-6">Choose Your Plan</h1>

      <div className="text-gray-300 mb-12 text-center max-w-2xl">
        Subscribe to unlock the full Dealer AI Assistant—social image generator,
        compliance engine, chat AI, laws database, and dealer-specific memory.
      </div>

      {/* Subscription Boxes */}
      <div className="grid md:grid-cols-2 gap-10 w-full max-w-4xl">

        {/* MONTHLY */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Monthly Plan</h2>

          <div className="text-5xl font-bold mb-4">$30</div>
          <div className="text-gray-300 mb-6">Billed monthly</div>

          <button
            className="py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold disabled:opacity-50"
            onClick={() => startCheckout("monthly")}
            disabled={loading}
          >
            {loading ? "Loading…" : "Subscribe Monthly"}
          </button>
        </div>

        {/* ANNUAL */}
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Annual Plan</h2>

          <div className="text-5xl font-bold mb-4">$300</div>
          <div className="text-gray-300 mb-6">Save 2 months</div>

          <button
            className="py-3 bg-green-600 hover:bg-green-500 rounded-xl text-lg font-semibold disabled:opacity-50"
            onClick={() => startCheckout("annual")}
            disabled={loading}
          >
            {loading ? "Loading…" : "Subscribe Annually"}
          </button>
        </div>
      </div>

      {/* Promo Section */}
      <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 mt-14 w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">Promo Code</h3>

        <input
          type="text"
          placeholder="Enter promo code"
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white mb-4"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
        />

        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-lg font-semibold"
          onClick={applyPromo}
          disabled={loading}
        >
          Apply Promo
        </button>
      </div>

    </div>
  );
}
