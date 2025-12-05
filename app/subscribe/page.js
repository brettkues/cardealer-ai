"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SubscribePage() {
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (!data.loggedIn) {
        router.push("/login");
        return;
      }

      setUid(data.uid);
    }

    loadSession();
  }, [router]);

  // Call Stripe checkout
  async function subscribe(priceId) {
    if (!uid) return;

    setLoading(true);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ uid, priceId }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error: " + data.error);
    }
  }

  if (!uid) {
    return (
      <div className="h-screen flex justify-center items-center text-white">
        Checking account…
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Subscription Required</h1>
      <p style={{ marginTop: 10 }}>
        Choose a plan below to unlock all dealer tools.
      </p>

      <button
        onClick={() => subscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID)}
        disabled={loading}
        style={{
          marginTop: 30,
          padding: "12px 20px",
          background: "#2563eb",
          color: "white",
          borderRadius: 8,
        }}
      >
        {loading ? "Redirecting…" : "Subscribe Now"}
      </button>
    </div>
  );
}
