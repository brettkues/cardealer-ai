export const runtime = "nodejs";          // REQUIRED for Firestore Admin SDK
export const dynamic = "force-dynamic";   // Prevent static optimization
export const maxDuration = 60;            // Avoid Vercel timeouts

import { corsHeaders, handleCors } from "@/app/utils/cors";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ------------------------------------
// Initialize Firebase Admin
// ------------------------------------
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

const adminDb = getFirestore();

export async function POST(request) {
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

    // Only valid code
    if (normalized !== "dealerpass") {
      return new Response(JSON.stringify({ error: "Invalid promo code." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
        headers: corsHeaders(),
      });
    }

    const data = snap.data();

    // Prevent reuse
    if (data.promoUsed === "dealerpass") {
      return new Response(JSON.stringify({ error: "Promo code already used." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Activate promo subscription
    await userRef.update({
      subscriptionActive: true,
      subscriptionSource: "promo",
      promoUsed: "dealerpass",
      activatedAt: Timestamp.now(),
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
