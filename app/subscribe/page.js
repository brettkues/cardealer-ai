"use client";

import { useEffect, useState } from "react";

export default function SubscribePage() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch UID from secure cookie
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/session/get");
      const data = await res.json();
      setUid(data.uid || null);
    }
    load();
  }, []);

  async function subscribe() {
    if (!uid) {
      alert("No user session found. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      alert("Checkout error: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Subscribe</h1>

      {!uid ? (
        <p style={{ marginTop: 20 }}>Loading your session…</p>
      ) : (
        <button
          onClick={subscribe}
          disabled={loading}
          style={{ marginTop: 30, padding: "12px 20px" }}
        >
          {loading ? "Redirecting…" : "Subscribe for Full Access"}
        </button>
      )}
    </div>
  );
}
