"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/app/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SubscribePage() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const MONTHLY_PRICE_ID = "price_monthly_30"; // replace with your Stripe price ID
  const YEARLY_PRICE_ID = "price_yearly_300"; // replace with your Stripe annual price ID
  const VALID_PROMO = "DEALERPASS";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);

        // Check if already subscribed
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          if (data.role === "admin") router.push("/dashboard"); // admin bypass
          if (data.subscriptionActive) router.push("/dashboard");
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading)
    return (
      <div className="p-10 text-center text-xl text-white bg-gray-900 h-screen">
        Loading…
      </div>
    );

  if (!uid) {
    return (
      <div className="p-10 text-center text-xl bg-gray-900 text-white h-screen">
        <p>You must log in to subscribe.</p>
      </div>
    );
  }

  const startStripeCheckout = async (priceId) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ uid, priceId }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert("Stripe error.");
  };

  const activatePromo = async () => {
    if (promoCode.trim().toUpperCase() !== VALID_PROMO) {
      setError("Invalid promo code");
      return;
    }

    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      subscriptionActive: true,
      subscriptionSource: "promo",
      promoCode: VALID_PROMO,
      trialEnds: null,
    });

    router.push("/dashboard");
  };

  const startFreeTrial = async () => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const ref = doc(db, "users", uid);
    await updateDoc(ref, {
      subscriptionActive: true,
      subscriptionSource: "trial",
      trialEnds: sevenDaysFromNow.toISOString(),
    });

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Subscribe to CarDealer-AI</h1>
        <p className="text-gray-300 mb-12 text-lg">
          Your dealership’s AI engine, image generator, and marketing assistant —
          all in one place.
        </p>

        {/* Pricing Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

          {/* Monthly Plan */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-2">$30 / month</h2>
            <p className="text-gray-400 mb-6">Full access. Cancel anytime.</p>
            <button
              onClick={() => startStripeCheckout(MONTHLY_PRICE_ID)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold"
            >
              Start Monthly Plan
            </button>
          </div>

          {/* Annual Plan */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl border-2 border-yellow-500">
            <div className="text-yellow-400 font-bold mb-2">Best Value</div>
            <h2 className="text-2xl font-bold mb-2">$300 / year</h2>
            <p className="text-gray-400 mb-6">
              Save $60 — 2 months free.
            </p>
            <button
              onClick={() => startStripeCheckout(YEARLY_PRICE_ID)}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-3 rounded-lg font-semibold"
            >
              Start Annual Plan
            </button>
          </div>

        </div>

        {/* Free Trial */}
        <div className="mb-12">
          <button
            onClick={startFreeTrial}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-lg font-semibold"
          >
            Start 7-Day Free Trial
          </button>
        </div>

        {/* Promo Code */}
        <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-12">
          <h3 className="text-xl font-bold mb-4">Have a promo code?</h3>

          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter code"
            className="w-full p-3 rounded bg-gray-700 text-white mb-3"
          />

          {error && <p className="text-red-400 mb-3">{error}</p>}

          <button
            onClick={activatePromo}
            className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-lg font-semibold"
          >
            Apply Code
          </button>
        </div>

      </div>
    </div>
  );
}
