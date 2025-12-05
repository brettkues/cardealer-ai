"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) initializeApp(firebaseConfig);

const auth = getAuth();

export default function SubscribePage() {
  const router = useRouter();

  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Get logged-in user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setUid(user.uid);
    });
    return () => unsub();
  }, [router]);

  async function startSubscription() {
    if (!uid) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          uid,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start session");

      window.location.href = data.url; // redirect to Stripe
    } catch (err) {
      setMessage("Error: " + err.message);
      setLoading(false);
    }
  }

  if (!uid) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking login…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-96">
        <h1 className="text-2xl font-bold mb-3">Activate Subscription</h1>

        <p className="text-gray-300 mb-6">
          Access all dealer tools, features, and law library uploads.
        </p>

        <button
          onClick={startSubscription}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-semibold"
        >
          {loading ? "Redirecting…" : "Subscribe Now"}
        </button>

        {message && (
          <p className="text-red-400 text-sm mt-4 whitespace-pre-line">{message}</p>
        )}

        <p className="text-sm text-gray-400 mt-6">
          <a href="/dashboard" className="text-blue-400">Back to Dashboard</a>
        </p>
      </div>
    </div>
  );
}
