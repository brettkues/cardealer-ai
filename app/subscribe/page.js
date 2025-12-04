"use client";

import { useState } from "react";

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoResult, setPromoResult] = useState(null);

  async function applyPromo() {
    setPromoResult(null);

    const res = await fetch("/api/promo", {
      method: "POST",
      body: JSON.stringify({ code: promo }),
    });

    const data = await res.json();
    setPromoResult(data);
  }

  async function startCheckout(priceId) {
    setLoading(true);

    const uid = localStorage.getItem("uid");
    if (!uid) {
      alert("You must be logged in.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ uid, priceId }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error: " + data.error);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Subscribe</h1>

      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="Promo code"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
        />
        <button onClick={applyPromo}>Apply</button>

        {promoResult && (
          <p>
            {promoResult.valid
              ? `Promo applied! Discount: ${promoResult.discount}%`
              : promoResult.message}
          </p>
        )}
      </div>

      <h2 style={{ marginTop: 40 }}>Choose a plan:</h2>

      <button
        disabled={loading}
        onClick={() => startCheckout(process.env.NEXT_PUBLIC_PRICE_ID)}
      >
        Subscribe Now
      </button>
    </div>
  );
}
