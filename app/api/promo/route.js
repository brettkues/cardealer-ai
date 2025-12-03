export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { corsHeaders, handleCors } from "../../utils/cors";

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Firebase Admin Initialization -------------------------
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

const adminDB = getFirestore();
// --------------------------------------------------------

export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { uid, code } = await request.json();

    if (!uid || !code) {
      return new Response(
        JSON.stringify({ error: "Missing UID or promo code." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    const normalized = code.trim().toLowerCase();

    // Only valid promo
    if (normalized !== "dealerpass") {
      return new Response(
        JSON.stringify({ error: "Invalid promo code." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    const userRef = adminDB.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return new Response(
        JSON.stringify({ error: "User not found." }),
        { status: 404, headers: corsHeaders() }
      );
    }

    const data = snap.data();

    if (data.promoUsed === "dealerpass") {
      return new Response(
        JSON.stringify({ error: "Promo code already used." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Activate subscription
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
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
