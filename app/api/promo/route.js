import { corsHeaders, handleCors } from "@/app/utils/cors";
import { db } from "@/app/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request) {
  // CORS preflight
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { uid, code } = await request.json();

    if (!uid || !code) {
      return new Response(JSON.stringify({ error: "Missing UID or promo code." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const normalized = code.trim().toLowerCase();

    // Only valid promo
    if (normalized !== "dealerpass") {
      return new Response(JSON.stringify({ error: "Invalid promo code." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Load user record
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
        headers: corsHeaders(),
      });
    }

    const data = snap.data();

    // Prevent using promo twice
    if (data.promoUsed === "dealerpass") {
      return new Response(JSON.stringify({ error: "Promo code already used." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Activate subscription
    await updateDoc(userRef, {
      subscriptionActive: true,
      subscriptionSource: "promo",
      promoUsed: "dealerpass",
      activatedAt: serverTimestamp(),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
